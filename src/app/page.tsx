import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { CONFIG } from '@/lib/config';
import { StatCards } from '@/components/home/StatCards';
import { HomeClientWrapper } from '@/components/home/HomeClientWrapper';
import { DynamicMap } from '@/components/map/DynamicMap';
import { LiveFeed } from '@/components/home/LiveFeed';

export const revalidate = 30; // ISR cache revalidation every 30 seconds

export default async function HomePage() {
  // Parallel server-side data fetching
  const [reports, totalReports, resolvedCount, criticalIssuesCount, hotspotCount] =
    await Promise.all([
      prisma.report.findMany({
        take: 30,
        orderBy: [{ priorityScore: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.report.count(),
      prisma.report.count({
        where: { status: { in: ['RESOLVED', 'CLOSED'] } },
      }),
      prisma.report.count({
        where: { urgencyLevel: 'CRITICAL', status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] } },
      }),
      prisma.report.count({
        where: { clusterId: { not: null } },
      }),
    ]);

  const resolutionRatePercent =
    totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0;
  const activeHotspotsCount = Math.ceil(hotspotCount / CONFIG.CLUSTERING.MIN_REPORTS_FOR_HOTSPOT);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem' }}>
      {/* 1. Page Title & Hero Header */}
      <section
        aria-labelledby="main-heading"
        style={{
          textAlign: 'center',
          marginBottom: '2.5rem',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.9rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: 'var(--primary)',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem',
          }}
        >
          <span>Municipal AI Dispatch v1.0</span>
        </div>

        <h1
          id="main-heading"
          style={{
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          PromptWars x Astra Civic Issue Triage
        </h1>

        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            maxWidth: '720px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Automated municipal incident dispatch combining deterministic multi-factor priority
          scoring, 200m spatial deduplication, and Gemini AI triage.
        </p>
      </section>

      {/* 2. Key Performance Indicators & Stat Cards */}
      <StatCards
        totalReports={totalReports}
        resolvedCount={resolvedCount}
        resolutionRatePercent={resolutionRatePercent}
        criticalIssuesCount={criticalIssuesCount}
        activeHotspotsCount={activeHotspotsCount}
      />

      {/* 3. Quick Action Tools & Report Modal */}
      <HomeClientWrapper />

      {/* 4. Hero Incident & Hotspot Map with Accessible List View */}
      <DynamicMap reports={reports} />

      {/* 5. Live Feed with Real-time Filters */}
      <LiveFeed initialReports={reports} />
    </div>
  );
}
