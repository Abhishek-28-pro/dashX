import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { CONFIG } from '@/lib/config';
import { createReportSchema, queryReportsSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { calculatePriorityScore } from '@/lib/ai/priority';
import { calculateBoundingBox } from '@/lib/ai/distance';
import { findDuplicateCandidate } from '@/lib/ai/duplicates';
import { enrichReportWithAI } from '@/lib/ai/gemini';
import { createErrorResponse, AppError } from '@/lib/errors';
import type { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const parsedQuery = queryReportsSchema.safeParse(queryParams);
    if (!parsedQuery.success) {
      throw new AppError(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400,
        parsedQuery.error.format()
      );
    }

    const { page, limit, status, category, ward, search, minLat, maxLat, minLng, maxLng } =
      parsedQuery.data;

    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (ward) {
      where.ward = { contains: ward };
    }

    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } },
        { address: { contains: search.trim() } },
      ];
    }

    // Spatial bounding box query for map viewport
    if (
      minLat !== undefined &&
      maxLat !== undefined &&
      minLng !== undefined &&
      maxLng !== undefined
    ) {
      where.latitude = { gte: minLat, lte: maxLat };
      where.longitude = { gte: minLng, lte: maxLng };
    }

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priorityScore: 'desc' }, { createdAt: 'desc' }],
        include: {
          _count: {
            select: { childReports: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. In-memory Rate Limiting
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    checkRateLimit(
      `submit:${clientIp}`,
      CONFIG.SECURITY.RATE_LIMIT_SUBMIT_WINDOW_MS,
      CONFIG.SECURITY.RATE_LIMIT_SUBMIT_MAX_REQUESTS
    );

    // 2. Validate input with Zod
    const body = await req.json();
    const validated = createReportSchema.safeParse(body);
    if (!validated.success) {
      throw new AppError('Validation error', 'VALIDATION_ERROR', 400, validated.error.format());
    }

    const input = validated.data;

    // 3. Generate Unguessable Tracking ID (REP-XXXXXXXX)
    const randomSuffix = crypto
      .randomBytes(CONFIG.SECURITY.TRACKING_ID_RANDOM_LENGTH / 2)
      .toString('hex')
      .toUpperCase();
    const trackingId = `${CONFIG.SECURITY.TRACKING_ID_PREFIX}${randomSuffix}`;

    // 4. Duplicate Detection Pre-Filter (Spatial Bounding Box)
    const bbox = calculateBoundingBox(
      { latitude: input.latitude, longitude: input.longitude },
      CONFIG.DUPLICATES.RADIUS_METERS
    );

    const candidates = await prisma.report.findMany({
      where: {
        category: input.category,
        status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] },
        latitude: { gte: bbox.minLat, lte: bbox.maxLat },
        longitude: { gte: bbox.minLng, lte: bbox.maxLng },
      },
      select: {
        id: true,
        category: true,
        description: true,
        latitude: true,
        longitude: true,
      },
    });

    const duplicateResult = findDuplicateCandidate(
      {
        category: input.category,
        description: input.description,
        location: { latitude: input.latitude, longitude: input.longitude },
      },
      candidates
    );

    // 5. Enrich with AI / Fallback
    const aiEnrichment = await enrichReportWithAI(input.title, input.description, input.category);

    // 6. Calculate Deterministic Priority Score
    const priorityResult = calculatePriorityScore({
      category: input.category,
      duplicateCount: duplicateResult.isDuplicate ? 1 : 0,
      ageInHours: 0,
      isNearCriticalInfrastructure: false,
      llmUrgencyFactor: aiEnrichment.urgencyFactor,
    });

    // 7. Persist Report in Database
    const report = await prisma.report.create({
      data: {
        trackingId,
        title: input.title,
        description: input.description,
        rawDescription: input.description,
        category: input.category,
        subCategory: aiEnrichment.subCategory || input.subCategory,
        status: 'SUBMITTED',
        priorityScore: priorityResult.score,
        urgencyLevel: priorityResult.urgencyLevel,
        priorityRationale: priorityResult.rationale.join(' | '),
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.address,
        ward: input.ward,
        imageUrl: input.imageUrl,
        imageAltText: input.imageAltText || aiEnrichment.suggestedAltText,
        reporterName: input.reporterName,
        reporterPhone: input.reporterPhone,
        isDuplicate: duplicateResult.isDuplicate,
        parentReportId: duplicateResult.matchedReportId,
        similarityScore: duplicateResult.similarityScore,
        aiCategorized: true,
        aiSummary: aiEnrichment.summary,
        assignedDept: aiEnrichment.department,
        statusHistory: {
          create: [
            {
              fromStatus: 'SUBMITTED',
              toStatus: 'SUBMITTED',
              changedBy: 'SYSTEM_CITIZEN',
              note: duplicateResult.isDuplicate
                ? `Submitted and automatically linked to parent report ${duplicateResult.matchedReportId} (${(duplicateResult.similarityScore * 100).toFixed(0)}% match)`
                : 'Report submitted by citizen and queued for triage.',
            },
          ],
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        trackingId,
        isDuplicate: duplicateResult.isDuplicate,
        report,
      },
      { status: 201 }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
