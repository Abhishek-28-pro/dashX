import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { trackReportSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { createErrorResponse, AppError } from '@/lib/errors';
import { CONFIG } from '@/lib/config';
import type { PublicTrackReport, IssueCategory, IssueStatus, UrgencyLevel } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    // 1. Rate limiting on tracking lookups (30 per min)
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    checkRateLimit(
      `track:${clientIp}`,
      CONFIG.SECURITY.RATE_LIMIT_TRACK_WINDOW_MS,
      CONFIG.SECURITY.RATE_LIMIT_TRACK_MAX_REQUESTS
    );

    const { trackingId } = await params;

    // 2. Validate tracking ID format
    const validated = trackReportSchema.safeParse({ trackingId });
    if (!validated.success) {
      throw new AppError('Invalid tracking reference format', 'VALIDATION_ERROR', 400);
    }

    // 3. Query report
    const report = await prisma.report.findUnique({
      where: { trackingId: validated.data.trackingId },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: {
            toStatus: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });

    if (!report) {
      throw new AppError('No report found matching this tracking reference ID', 'NOT_FOUND', 404);
    }

    // 4. Safe Public Projection (Strict PII stripping & coordinate rounding)
    const publicData: PublicTrackReport = {
      trackingId: report.trackingId,
      title: report.title,
      category: report.category as IssueCategory,
      status: report.status as IssueStatus,
      urgencyLevel: report.urgencyLevel as UrgencyLevel,
      approxLocation: {
        latitude: Math.round(report.latitude * 100) / 100, // Rounded to 2 decimals
        longitude: Math.round(report.longitude * 100) / 100,
        ward: report.ward,
      },
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      resolvedAt: report.resolvedAt?.toISOString() || null,
      publicNotes: report.statusHistory.map((h) => ({
        status: h.toStatus as IssueStatus,
        changedAt: h.createdAt.toISOString(),
        note: h.note,
      })),
    };

    return NextResponse.json({ report: publicData });
  } catch (error) {
    return createErrorResponse(error);
  }
}
