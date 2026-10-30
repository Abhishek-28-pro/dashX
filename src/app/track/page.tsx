'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck } from 'lucide-react';

export default function TrackSearchPage() {
  const [trackingId, setTrackingId] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackingId.trim().toUpperCase();
    if (clean) {
      router.push(`/track/${encodeURIComponent(clean)}`);
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 1.5rem', maxWidth: '640px' }}>
      <section
        aria-labelledby="track-heading"
        className="glass-panel"
        style={{ padding: '2.5rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <ShieldCheck size={26} aria-hidden="true" />
          </div>

          <h1
            id="track-heading"
            style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}
          >
            Track Incident Resolution
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Enter your unguessable tracking reference code to check field crew dispatch and
            resolution status.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div>
            <label
              htmlFor="track-input-field"
              style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '0.4rem',
              }}
            >
              Tracking Reference Code (e.g. REP-7K9X2M4B)
            </label>
            <div style={{ position: 'relative' }}>
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
              <input
                id="track-input-field"
                type="text"
                required
                placeholder="REP-XXXXXXXX"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.05em',
                  minHeight: '48px',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ minHeight: '48px', fontSize: '1rem' }}
          >
            Look Up Incident Status
          </button>
        </form>
      </section>
    </div>
  );
}
