'use client';

import dynamic from 'next/dynamic';
import type { Report } from '@prisma/client';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div
      className="glass-panel"
      style={{
        height: '450px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        marginBottom: '2.5rem',
      }}
      aria-busy="true"
      aria-label="Loading interactive incident map"
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border-medium)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        <p>Loading Interactive Incident Map...</p>
      </div>
    </div>
  ),
});

interface DynamicMapProps {
  reports: Report[];
  height?: string;
}

export function DynamicMap(props: DynamicMapProps) {
  return <LeafletMap {...props} />;
}
