'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Report } from '@prisma/client';
import type { HotspotCluster, IssueCategory } from '@/types';
import { IssueCategories } from '@/types';
import { MapPin, List, Flame, CheckCircle, Layers, ChevronRight } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface MapsViewProps {
  reports: Report[];
  hotspots: HotspotCluster[];
}

export function MapsView({ reports, hotspots }: MapsViewProps) {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [selectedCluster, setSelectedCluster] = useState<HotspotCluster | null>(null);
  const [showHotspotLayer, setShowHotspotLayer] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  // Wards list
  const wards = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.ward) set.add(r.ward);
    });
    return Array.from(set);
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
      if (selectedWard !== 'ALL' && r.ward !== selectedWard) return false;
      return true;
    });
  }, [reports, selectedCategory, selectedWard]);

  // Filtered hotspots
  const filteredHotspots = useMemo(() => {
    return hotspots.filter((h) => {
      if (selectedCategory !== 'ALL' && h.category !== selectedCategory) return false;
      if (selectedWard !== 'ALL' && h.ward !== selectedWard) return false;
      return true;
    });
  }, [hotspots, selectedCategory, selectedWard]);

  // Leaflet map initialization
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        (mapInstanceRef.current as L.Map).remove();
        mapInstanceRef.current = null;
      }

      const defaultLat = filteredReports[0]?.latitude || 28.6315;
      const defaultLng = filteredReports[0]?.longitude || 77.2167;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 13,
      });

      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Category colors
      const categoryColors: Record<string, string> = {
        POTHOLE: '#ef4444',
        GARBAGE: '#f59e0b',
        STREETLIGHT: '#38bdf8',
        WATER_LEAKAGE: '#06b6d4',
        TRAFFIC_HAZARD: '#e11d48',
        DRAINAGE: '#8b5cf6',
        OTHER: '#94a3b8',
      };

      // 1. Draw Hotspot Density Circles if layer is enabled
      if (showHotspotLayer) {
        filteredHotspots.forEach((h) => {
          const color = categoryColors[h.category] || '#f59e0b';
          const circle = L.circle([h.center.latitude, h.center.longitude], {
            radius: h.radiusMeters,
            color,
            fillColor: color,
            fillOpacity: 0.25,
            weight: 2,
            dashArray: '6, 6',
          });

          const popupContent = `
            <div style="font-family: sans-serif; color: #0f172a; padding: 4px; min-width: 220px;">
              <div style="font-weight: 800; font-size: 13px; color: #b45309; text-transform: uppercase;">
                HOTSPOT CLUSTER: ${h.category}
              </div>
              <div style="font-weight: 700; font-size: 14px; margin: 4px 0;">${h.ward}</div>
              <div style="font-size: 12px; margin-bottom: 4px;">Volume: <strong>${h.reportCount} reports</strong></div>
              <div style="font-size: 12px; margin-bottom: 6px;">Severity Index: <strong>${h.severityScore.toFixed(1)}/100</strong></div>
              <div style="font-size: 11px; color: #475569; background: #fef3c7; padding: 6px; border-radius: 4px;">
                ${h.actionBrief}
              </div>
            </div>
          `;

          circle.bindPopup(popupContent);
          circle.addTo(map);
        });
      }

      // 2. Draw Incident Markers
      filteredReports.forEach((report) => {
        const color = categoryColors[report.category] || '#38bdf8';
        const marker = L.circleMarker([report.latitude, report.longitude], {
          radius: report.urgencyLevel === 'CRITICAL' ? 9 : 7,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        });

        const popupContent = `
          <div style="font-family: sans-serif; color: #0f172a; padding: 4px; min-width: 180px;">
            <div style="font-weight: 700; font-size: 13px;">${report.title}</div>
            <div style="font-size: 11px; color: #475569; margin: 3px 0;">${report.category} • Ref: ${report.trackingId}</div>
            <div style="font-size: 11px;">Priority: <strong>${report.priorityScore.toFixed(1)}/100</strong></div>
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
  }, [filteredReports, filteredHotspots, showHotspotLayer, viewMode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Control & Filter Strip */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Category Filter */}
          <div>
            <label htmlFor="map-category-select" className="sr-only">
              Filter by Category
            </label>
            <select
              id="map-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                minHeight: '40px',
              }}
            >
              <option value="ALL">All Categories ({reports.length})</option>
              {IssueCategories.map((c: IssueCategory) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Ward Filter */}
          <div>
            <label htmlFor="map-ward-select" className="sr-only">
              Filter by Ward
            </label>
            <select
              id="map-ward-select"
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                minHeight: '40px',
              }}
            >
              <option value="ALL">All Wards</option>
              {wards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Hotspot Layer Toggle */}
          <button
            type="button"
            onClick={() => setShowHotspotLayer(!showHotspotLayer)}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 0.85rem',
              fontSize: '0.85rem',
              minHeight: '40px',
              backgroundColor: showHotspotLayer ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: showHotspotLayer ? '#f59e0b' : 'var(--text-secondary)',
              borderColor: showHotspotLayer ? '#f59e0b' : 'var(--border-subtle)',
            }}
            aria-pressed={showHotspotLayer}
          >
            <Layers size={16} aria-hidden="true" />
            <span>Hotspots ({filteredHotspots.length})</span>
          </button>
        </div>

        {/* Accessible View Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`btn ${viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', minHeight: '38px' }}
            aria-pressed={viewMode === 'map'}
          >
            <MapPin size={16} aria-hidden="true" />
            <span>Map View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', minHeight: '38px' }}
            aria-pressed={viewMode === 'list'}
            aria-label="Accessible table list view of all map markers"
          >
            <List size={16} aria-hidden="true" />
            <span>Accessible List View</span>
          </button>
        </div>
      </div>

      {/* Main Map / Accessible Table Area */}
      {viewMode === 'map' ? (
        <div
          ref={mapContainerRef}
          style={{
            height: '520px',
            width: '100%',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border-medium)',
            backgroundColor: '#0b0f19',
          }}
          aria-label="Interactive geospatial map displaying civic incidents and circular hotspot density clusters."
        />
      ) : (
        /* Accessible WCAG 2.1 AA Compliant Table View */
        <div
          className="glass-panel"
          style={{ padding: '1.5rem', maxHeight: '550px', overflowY: 'auto' }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.9rem',
            }}
          >
            <caption className="sr-only">
              Complete accessible list of all mapped civic incidents and active hotspots
            </caption>
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
                  Urgency
                </th>
                <th scope="col" style={{ padding: '0.75rem' }}>
                  Status
                </th>
                <th scope="col" style={{ padding: '0.75rem' }}>
                  Priority Score
                </th>
                <th scope="col" style={{ padding: '0.75rem' }}>
                  Coordinates
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
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
                    <span
                      className={`badge ${
                        report.urgencyLevel === 'CRITICAL'
                          ? 'badge-critical'
                          : report.urgencyLevel === 'HIGH'
                            ? 'badge-high'
                            : 'badge-low'
                      }`}
                    >
                      {report.urgencyLevel}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className="badge badge-low">{report.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 800 }}>
                    {report.priorityScore.toFixed(1)}/100
                  </td>
                  <td
                    style={{
                      padding: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Active Hotspots & AI Action Briefs Grid */}
      <section aria-labelledby="action-briefs-heading">
        <div style={{ marginBottom: '1.25rem' }}>
          <h2
            id="action-briefs-heading"
            style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}
          >
            Tactical Action Briefs for Municipal Crews
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            AI-synthesized operational deployment plans grouped by geographic incident density
          </p>
        </div>

        {filteredHotspots.length === 0 ? (
          <div
            className="glass-card"
            style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}
          >
            <CheckCircle size={32} style={{ margin: '0 auto 0.75rem', color: '#10b981' }} />
            <p style={{ fontWeight: 600 }}>No active hotspot clusters in this selection</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Incidents are isolated and below the 3-report density threshold.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {filteredHotspots.map((hotspot) => (
              <article
                key={hotspot.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${
                    hotspot.severityScore >= 80
                      ? 'var(--status-critical)'
                      : hotspot.severityScore >= 60
                        ? '#f59e0b'
                        : 'var(--primary)'
                  }`,
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <span className="badge badge-high">
                      <Flame size={12} aria-hidden="true" />
                      <span>{hotspot.category} CLUSTER</span>
                    </span>

                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: hotspot.severityScore >= 80 ? 'var(--status-critical)' : '#f59e0b',
                      }}
                    >
                      Severity {hotspot.severityScore.toFixed(1)}/100
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    {hotspot.ward} Density Zone
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '1rem',
                    }}
                  >
                    <span>
                      <strong>{hotspot.reportCount}</strong> Reports Linked
                    </span>
                    <span>•</span>
                    <span>
                      <strong>350m</strong> Radius
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      lineHeight: 1.5,
                      borderLeft: '2px solid var(--primary)',
                    }}
                  >
                    {hotspot.actionBrief}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '1.25rem',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '0.75rem',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Centroid: {hotspot.center.latitude.toFixed(4)},{' '}
                    {hotspot.center.longitude.toFixed(4)}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedCluster(hotspot)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', minHeight: '34px' }}
                  >
                    <span>Inspect</span>
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Cluster Inspector Drawer / Modal */}
      {selectedCluster && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setSelectedCluster(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#0f172a',
              border: '1px solid var(--border-medium)',
              padding: '1.75rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {selectedCluster.category} Cluster Inspection
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCluster(null)}
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.6rem', minHeight: '32px' }}
              >
                Close
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Ward: <strong>{selectedCluster.ward}</strong> | Density:{' '}
              <strong>{selectedCluster.reportCount} reports</strong>
            </p>

            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              <strong>Tactical Dispatch Plan:</strong>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                {selectedCluster.actionBrief}
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Linked Report IDs: {selectedCluster.reportIds.join(', ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
