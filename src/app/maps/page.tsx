import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { clusterIncidents, type ClusterableReport } from '@/lib/ai/clustering';
import { generateActionBrief } from '@/lib/ai/brief';
import { DynamicMapsView } from '@/components/map/DynamicMapsView';
import type { HotspotCluster, IssueCategory } from '@/types';
import { Flame, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MapsPage() {
  let reports: Awaited<ReturnType<typeof prisma.report.findMany>> = [];
  try {
    reports = await prisma.report.findMany({
      where: {
        status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] },
      },
      orderBy: [{ priorityScore: 'desc' }],
      take: 100,
    });
  } catch (err) {
    console.error('[MapsPage] Database query exception, rendering graceful state:', err);
  }

  const clusterable: ClusterableReport[] = reports.map((r) => ({
    id: r.id,
    category: r.category as IssueCategory,
    ward: r.ward || 'Central Ward',
    latitude: r.latitude,
    longitude: r.longitude,
    priorityScore: r.priorityScore,
  }));

  const clusters = clusterIncidents(clusterable);

  const hotspots: HotspotCluster[] = clusters.map((c) => ({
    ...c,
    actionBrief: generateActionBrief(c),
  }));

  // Geographic Insights
  const highestSeverityHotspot =
    hotspots.length > 0
      ? hotspots.reduce((max, h) => (h.severityScore > max.severityScore ? h : max), hotspots[0])
      : null;

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem' }}>
      {/* Page Header */}
      <section aria-labelledby="maps-title" style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.8rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
          }}
        >
          <Flame size={14} aria-hidden="true" />
          <span>Spatial Density Analytics</span>
        </div>

        <h1
          id="maps-title"
          style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            marginBottom: '0.5rem',
          }}
        >
          Metropolitan Hotspot Layer & Spatial Dispatch
        </h1>

        <p style={{ color: 'var(--text-secondary)', maxWidth: '750px', fontSize: '1rem' }}>
          Real-time incident clustering using 350-meter density radii. Synthesizes automated
          tactical action briefs for municipal response units and neighborhood ward teams.
        </p>
      </section>

      {/* Insights Strip */}
      <section
        aria-labelledby="insights-heading"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <h2 id="insights-heading" className="sr-only">
          Spatial Insights Overview
        </h2>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
            <Flame size={18} aria-hidden="true" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Hotspots</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem' }}>
            {hotspots.length} Clusters
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            $\ge 3$ verified incidents within 350m
          </div>
        </div>

        <div className="glass-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--primary)',
            }}
          >
            <MapPin size={18} aria-hidden="true" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mapped Open Incidents</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem' }}>
            {reports.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Awaiting triage or crew dispatch
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
            <AlertTriangle size={18} aria-hidden="true" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Highest Risk Cluster</span>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.5rem' }}>
            {highestSeverityHotspot
              ? `${highestSeverityHotspot.ward} (${highestSeverityHotspot.category})`
              : 'None Detected'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {highestSeverityHotspot
              ? `Severity Score: ${highestSeverityHotspot.severityScore.toFixed(1)}/100`
              : 'All clusters operating within standard bounds'}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
            <ShieldCheck size={18} aria-hidden="true" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dispatch Readiness</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.5rem' }}>
            100% Covered
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Tactical action briefs pre-generated
          </div>
        </div>
      </section>

      {/* Interactive Map & Action Briefs View */}
      <DynamicMapsView reports={reports} hotspots={hotspots} />
    </div>
  );
}
