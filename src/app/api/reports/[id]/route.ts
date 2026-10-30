import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { updateReportStatusSchema } from '@/lib/validation';
import { requireAdminRole } from '@/lib/security/auth';
import { createErrorResponse, AppError } from '@/lib/errors';
import type { IssueStatus } from '@/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        childReports: {
          select: {
            id: true,
            trackingId: true,
            title: true,
            createdAt: true,
            similarityScore: true,
          },
        },
      },
    });

    if (!report) {
      throw new AppError('Report not found', 'NOT_FOUND', 404);
    }

    return NextResponse.json({ report });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Server-side role enforcement (MOCKED auth)
    await requireAdminRole(req);

    const { id } = await params;
    const body = await req.json();

    // 2. Validate input with Zod
    const validated = updateReportStatusSchema.safeParse(body);
    if (!validated.success) {
      throw new AppError('Validation error', 'VALIDATION_ERROR', 400, validated.error.format());
    }

    const { status, assignedDept, assignedTeam, note } = validated.data;

    // 3. Verify existing report
    const existing = await prisma.report.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Report not found', 'NOT_FOUND', 404);
    }

    // 4. Update report & write to StatusHistory audit trail
    const isResolving = ['RESOLVED', 'CLOSED'].includes(status);

    const updated = await prisma.report.update({
      where: { id },
      data: {
        status,
        ...(assignedDept ? { assignedDept } : {}),
        ...(assignedTeam ? { assignedTeam } : {}),
        ...(isResolving && !existing.resolvedAt ? { resolvedAt: new Date() } : {}),
        statusHistory: {
          create: {
            fromStatus: existing.status as IssueStatus,
            toStatus: status as IssueStatus,
            changedBy: 'MUNICIPAL_ADMIN',
            note: note || `Status transitioned to ${status}`,
          },
        },
      },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      report: updated,
      message: `Status successfully updated to ${status}`,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
