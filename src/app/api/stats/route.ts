import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { CONFIG } from '@/lib/config';
import { createErrorResponse } from '@/lib/errors';

// In-memory cache for stats to prevent heavy DB aggregates on every hit
interface CachedStats {
  data: {
    totalReports: number;
    resolvedCount: number;
    resolutionRatePercent: number;
    criticalIssuesCount: number;
    activeHotspotsCount: number;
    categoryBreakdown: Record<string, number>;
  };
  cachedAt: number;
}

let cachedStats: CachedStats | null = null;

export async function GET() {
  try {
    const now = Date.now();
    if (cachedStats && now - cachedStats.cachedAt < CONFIG.CLUSTERING.CACHE_TTL_SECONDS * 1000) {
      return NextResponse.json(cachedStats.data, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': `public, s-maxage=${CONFIG.CLUSTERING.CACHE_TTL_SECONDS}, stale-while-revalidate=30`,
        },
      });
    }

    // Compute aggregates in parallel
    const [totalReports, resolvedCount, criticalIssuesCount, reportsByCategory, hotspotCount] =
      await Promise.all([
        prisma.report.count(),
        prisma.report.count({
          where: { status: { in: ['RESOLVED', 'CLOSED'] } },
        }),
        prisma.report.count({
          where: {
            urgencyLevel: 'CRITICAL',
            status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] },
          },
        }),
        prisma.report.groupBy({
          by: ['category'],
          _count: { category: true },
        }),
        prisma.report.count({
          where: { clusterId: { not: null } },
        }),
      ]);

    const resolutionRatePercent =
      totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0;

    const categoryBreakdown: Record<string, number> = {};
    for (const item of reportsByCategory) {
      categoryBreakdown[item.category] = item._count.category;
    }

    const data = {
      totalReports,
      resolvedCount,
      resolutionRatePercent,
      criticalIssuesCount,
      activeHotspotsCount: Math.ceil(hotspotCount / CONFIG.CLUSTERING.MIN_REPORTS_FOR_HOTSPOT),
      categoryBreakdown,
    };

    cachedStats = { data, cachedAt: now };

    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': `public, s-maxage=${CONFIG.CLUSTERING.CACHE_TTL_SECONDS}, stale-while-revalidate=30`,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
