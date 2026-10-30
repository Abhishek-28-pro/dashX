'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Report } from '@prisma/client';
import { MapPin, List, Eye } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  reports: Report[];
  height?: string;
}

export default function LeafletMap({ reports, height = '450px' }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet only in browser
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as L.Map).remove();
        mapInstanceRef.current = null;
      }

      // Default center: Connaught Place, New Delhi (28.6315, 77.2167)
      const centerLat = reports.length > 0 ? reports[0].latitude : 28.6315;
      const centerLng = reports.length > 0 ? reports[0].longitude : 77.2167;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 13,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Dark styled tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Category color mapping
      const categoryColors: Record<string, string> = {
        POTHOLE: '#ef4444',
        GARBAGE: '#f59e0b',
        STREETLIGHT: '#38bdf8',
        WATER_LEAKAGE: '#06b6d4',
        TRAFFIC_HAZARD: '#e11d48',
        DRAINAGE: '#8b5cf6',
        OTHER: '#94a3b8',
      };

      // Add circle markers for reports
      reports.forEach((report) => {
        const color = categoryColors[report.category] || '#38bdf8';

        const marker = L.circleMarker([report.latitude, report.longitude], {
          radius: report.urgencyLevel === 'CRITICAL' ? 10 : 8,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        });

        const popupContent = `
          <div style="font-family: sans-serif; color: #0f172a; padding: 4px; min-width: 180px;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${report.title}</div>
            <div style="font-size: 12px; margin-bottom: 6px;">${report.category} • ${report.status}</div>
            <div style="font-size: 11px; color: #475569;">Priority Score: <strong>${report.priorityScore.toFixed(1)}/100</strong></div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Ref: ${report.trackingId}</div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(map);
      });
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as L.Map).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [reports, viewMode]);

  return (
    <section
      aria-labelledby="hero-map-heading"
      className="glass-panel"
      style={{
        overflow: 'hidden',
        marginBottom: '2.5rem',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header with Accessible List View Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
        }}
      >
        <div>
          <h2
            id="hero-map-heading"
            style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}
          >
            Live Civic Incidents & Hotspots
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Interactive geographical distribution across metropolitan wards
          </p>
        </div>

        {/* Accessibility Toggle: View as Map vs View as List */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`btn ${viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', minHeight: '38px' }}
            aria-pressed={viewMode === 'map'}
          >
            <MapPin size={16} aria-hidden="true" />
            <span>Map View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', minHeight: '38px' }}
            aria-pressed={viewMode === 'list'}
            aria-label="Accessible table list view of all map markers"
          >
            <List size={16} aria-hidden="true" />
            <span>Accessible List View</span>
          </button>
        </div>
      </div>

      {/* Main Content: Map or Accessible Table */}
      {viewMode === 'map' ? (
        <div
          ref={mapContainerRef}
          style={{
            height,
            width: '100%',
            backgroundColor: '#0b0f19',
            zIndex: 1,
          }}
          aria-label="Geographic map displaying incident markers. Use the Accessible List View button above for a screen-reader friendly table."
        />
      ) : (
        <div
          style={{
            padding: '1.5rem',
            maxHeight: height,
            overflowY: 'auto',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.9rem',
            }}
          >
            <caption className="sr-only">List of all active mapped civic issues</caption>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-medium)',
                  color: 'var(--text-muted)',
                }}
              >
                <th scope="col" style={{ padding: '0.75rem' }}>
                  Ref ID
                </th>
                <th scope="col" style={{ padding: '0.75rem' }}>
                  Title & Ward
                </th>
                <th scope="col" style={{ padding: '0.75rem' }}>
                  Category
                </th>
                <th scope="col" style={{ padding: '0.75rem' }}>
                  Status
                </th>
                <th scope="col" style={{ padding: '0.75rem' }}>
                  Score
                </th>
                <th scope="col" style={{ padding: '0.75rem' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <td
                    style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                  >
                    {report.trackingId}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {report.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {report.ward || 'Central'}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className="badge badge-medium">{report.category}</span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className="badge badge-low">{report.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                    {report.priorityScore.toFixed(1)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedReport(report)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', minHeight: '36px' }}
                      aria-label={`View details for ${report.title}`}
                    >
                      <Eye size={14} aria-hidden="true" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedReport && (
            <div
              className="glass-card"
              style={{
                marginTop: '1.5rem',
                border: '1px solid var(--primary)',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {selectedReport.title} ({selectedReport.trackingId})
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                {selectedReport.description}
              </p>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Priority Rationale:</strong>{' '}
                {selectedReport.priorityRationale || 'Standard triage'}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
