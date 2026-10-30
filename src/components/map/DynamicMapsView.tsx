'use client';

import dynamic from 'next/dynamic';
import type { Report } from '@prisma/client';
import type { HotspotCluster } from '@/types';

const MapsViewComponent = dynamic(() => import('./MapsView').then((mod) => mod.MapsView), {
  ssr: false,
  loading: () => (
    <div
      className="glass-panel"
      style={{
        height: '520px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
      }}
      aria-busy="true"
      aria-label="Loading interactive geospatial map and active hotspot layer"
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
        <p>Loading Geospatial Map & Hotspots...</p>
      </div>
    </div>
  ),
});

interface DynamicMapsViewProps {
  reports: Report[];
  hotspots: HotspotCluster[];
}

export function DynamicMapsView(props: DynamicMapsViewProps) {
  return <MapsViewComponent {...props} />;
}
