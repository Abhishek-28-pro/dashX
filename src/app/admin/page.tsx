import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { ThreePaneAdmin } from '@/components/admin/ThreePaneAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  let reports: Awaited<
    ReturnType<
      typeof prisma.report.findMany<{
        include: {
          statusHistory: { orderBy: { createdAt: 'desc' } };
          childReports: {
            select: {
              id: true;
              trackingId: true;
              title: true;
              createdAt: true;
              similarityScore: true;
            };
          };
        };
      }>
    >
  > = [];

  try {
    reports = await prisma.report.findMany({
      orderBy: [{ priorityScore: 'desc' }, { createdAt: 'desc' }],
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
  } catch (err) {
    console.error('[AdminPage] Database query exception, rendering graceful state:', err);
  }

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
          Municipal Emergency Triage & Dispatch Console
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          3-pane real-time operations console: Triage queue, transparent AI scoring, and verified
          status transitions
        </p>
      </div>

      <ThreePaneAdmin initialReports={reports} />
    </div>
  );
}
