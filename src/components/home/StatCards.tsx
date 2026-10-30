'use client';

import React from 'react';
import { useLanguage } from '@/components/layout/LanguageContext';
import { FileText, CheckCircle2, AlertTriangle, Flame } from 'lucide-react';

interface StatsProps {
  totalReports: number;
  resolvedCount: number;
  resolutionRatePercent: number;
  criticalIssuesCount: number;
  activeHotspotsCount: number;
}

export function StatCards({
  totalReports,
  resolvedCount,
  resolutionRatePercent,
  criticalIssuesCount,
  activeHotspotsCount,
}: StatsProps) {
  const { t } = useLanguage();

  const cards = [
    {
      id: 'stat-total',
      label: t.stats.totalReports,
      value: totalReports.toLocaleString(),
      subtext: `${resolvedCount} resolved to date`,
      icon: FileText,
      color: '#38bdf8',
      bgGlow: 'rgba(56, 189, 248, 0.15)',
    },
    {
      id: 'stat-resolution',
      label: t.stats.resolvedRate,
      value: `${resolutionRatePercent}%`,
      subtext: 'Target: >85% within 48h',
      icon: CheckCircle2,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
    },
    {
      id: 'stat-critical',
      label: 'Critical Hazard Queue',
      value: criticalIssuesCount.toLocaleString(),
      subtext: 'Requires immediate dispatch',
      icon: AlertTriangle,
      color: '#ef4444',
      bgGlow: 'rgba(239, 68, 68, 0.15)',
    },
    {
      id: 'stat-hotspots',
      label: t.stats.activeHotspots,
      value: activeHotspotsCount.toLocaleString(),
      subtext: 'High-density incident clusters',
      icon: Flame,
      color: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
    },
  ];

  return (
    <section aria-labelledby="stats-heading" style={{ marginBottom: '2.5rem' }}>
      <h2 id="stats-heading" className="sr-only">
        Municipal Infrastructure Key Statistics
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="glass-card"
              style={{
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span
                  style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}
                >
                  {card.label}
                </span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: card.bgGlow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color,
                  }}
                  aria-hidden="true"
                >
                  <Icon size={20} />
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div
                  style={{
                    fontSize: '2.2rem',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: 'var(--text-primary)',
                  }}
                >
                  {card.value}
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.25rem',
                  }}
                >
                  {card.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
