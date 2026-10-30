import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { clusterIncidents, type ClusterableReport } from '@/lib/ai/clustering';
import { generateActionBrief } from '@/lib/ai/brief';
import { createErrorResponse } from '@/lib/errors';
import type { IssueCategory } from '@/types';

export async function GET() {
  try {
    const openReports = await prisma.report.findMany({
      where: {
        status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] },
      },
      select: {
        id: true,
        category: true,
        ward: true,
        latitude: true,
        longitude: true,
        priorityScore: true,
      },
    });

    const clusterable: ClusterableReport[] = openReports.map((r) => ({
      id: r.id,
      category: r.category as IssueCategory,
      ward: r.ward || 'Central Ward',
      latitude: r.latitude,
      longitude: r.longitude,
      priorityScore: r.priorityScore,
    }));

    const clusters = clusterIncidents(clusterable);

    // Attach freshly synthesized action briefs to each cluster
    const enrichedClusters = clusters.map((c) => ({
      ...c,
      actionBrief: generateActionBrief(c),
    }));

    return NextResponse.json({
      hotspots: enrichedClusters,
      totalHotspots: enrichedClusters.length,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
