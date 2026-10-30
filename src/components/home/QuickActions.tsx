'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/layout/LanguageContext';
import { PlusCircle, Search, MapPin } from 'lucide-react';

interface QuickActionsProps {
  onOpenReportModal?: () => void;
}

export function QuickActions({ onOpenReportModal }: QuickActionsProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [trackingIdInput, setTrackingIdInput] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = trackingIdInput.trim().toUpperCase();
    if (cleanId) {
      router.push(`/track/${encodeURIComponent(cleanId)}`);
    }
  };

  return (
    <section
      aria-labelledby="quick-actions-heading"
      className="glass-panel"
      style={{
        padding: '1.75rem',
        marginBottom: '2.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
      }}
    >
      <h2 id="quick-actions-heading" className="sr-only">
        Quick Action Tools
      </h2>

      {/* Primary Report CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {onOpenReportModal ? (
          <button
            type="button"
            onClick={onOpenReportModal}
            className="btn btn-primary"
            style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
          >
            <PlusCircle size={20} aria-hidden="true" />
            <span>{t.hero.reportCta}</span>
          </button>
        ) : (
          <Link
            href="/report"
            className="btn btn-primary"
            style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
          >
            <PlusCircle size={20} aria-hidden="true" />
            <span>{t.hero.reportCta}</span>
          </Link>
        )}

        <Link
          href="/maps"
          className="btn btn-secondary"
          style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}
        >
          <MapPin size={20} aria-hidden="true" />
          <span>{t.nav.maps}</span>
        </Link>
      </div>

      {/* Quick Track Input Form */}
      <form
        onSubmit={handleTrackSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flex: '1 1 320px',
          maxWidth: '450px',
        }}
        aria-label="Track report by reference ID"
      >
        <label htmlFor="quick-track-input" className="sr-only">
          Enter Tracking ID (e.g. REP-7K9X2M4B)
        </label>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            id="quick-track-input"
            type="text"
            placeholder="e.g. REP-7K9X2M4B"
            value={trackingIdInput}
            onChange={(e) => setTrackingIdInput(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              outline: 'none',
              minHeight: '44px',
            }}
          />
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
            aria-hidden="true"
          />
        </div>
        <button
          type="submit"
          className="btn btn-secondary"
          style={{ whiteSpace: 'nowrap', minHeight: '44px' }}
        >
          Track
        </button>
      </form>
    </section>
  );
}
