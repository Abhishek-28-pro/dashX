'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Report } from '@prisma/client';
import { IssueCategories, IssueStatuses, type IssueCategory, type IssueStatus } from '@/types';
import {
  AlertCircle,
  Clock,
  MapPin,
  CheckCircle,
  Copy,
  Search,
  Filter,
  Flame,
  ChevronRight,
} from 'lucide-react';

interface LiveFeedProps {
  initialReports: Report[];
}

export function LiveFeed({ initialReports }: LiveFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Client-side instant filter over reports
  const filteredReports = useMemo(() => {
    return initialReports.filter((report) => {
      if (selectedCategory !== 'ALL' && report.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'ALL' && report.status !== selectedStatus) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesTitle = report.title.toLowerCase().includes(query);
        const matchesDesc = report.description.toLowerCase().includes(query);
        const matchesTracking = report.trackingId.toLowerCase().includes(query);
        const matchesAddress = (report.address || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesTracking && !matchesAddress) {
          return false;
        }
      }
      return true;
    });
  }, [initialReports, selectedCategory, selectedStatus, searchTerm]);

  // Relative time helper
  const getRelativeTime = (dateString: Date | string) => {
    const diffHours = Math.round((Date.now() - new Date(dateString).getTime()) / (1000 * 3600));
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const getUrgencyBadgeClass = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'badge-critical';
      case 'HIGH':
        return 'badge-high';
      case 'MEDIUM':
        return 'badge-medium';
      default:
        return 'badge-low';
    }
  };

  return (
    <section aria-labelledby="live-feed-heading">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h2
            id="live-feed-heading"
            style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}
          >
            Live Civic Triage Feed
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Real-time verified citizen reports prioritized by deterministic multi-factor scoring
          </p>
        </div>

        {/* Live Region for Screen Readers */}
        <div aria-live="polite" className="sr-only">
          Showing {filteredReports.length} reports
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <label htmlFor="feed-search-input" className="sr-only">
            Search reports by title, description, or tracking ID
          </label>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
            aria-hidden="true"
          />
          <input
            id="feed-search-input"
            type="text"
            placeholder="Search keywords or tracking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem 0.6rem 2.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'rgba(11, 15, 25, 0.7)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              minHeight: '40px',
            }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-muted)" aria-hidden="true" />
          <label htmlFor="category-select" className="sr-only">
            Filter by Category
          </label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'rgba(11, 15, 25, 0.8)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              minHeight: '40px',
            }}
          >
            <option value="ALL">All Categories</option>
            {IssueCategories.map((cat: IssueCategory) => (
              <option key={cat} value={cat}>
                {cat.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status-select" className="sr-only">
            Filter by Status
          </label>
          <select
            id="status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'rgba(11, 15, 25, 0.8)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              minHeight: '40px',
            }}
          >
            <option value="ALL">All Statuses</option>
            {IssueStatuses.map((st: IssueStatus) => (
              <option key={st} value={st}>
                {st.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredReports.length === 0 ? (
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: 'var(--text-muted)',
            }}
          >
            <AlertCircle size={36} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No reports match your filters</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Try adjusting your category or search criteria.
            </p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <article
              key={report.id}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                borderLeft: `4px solid ${
                  report.urgencyLevel === 'CRITICAL'
                    ? 'var(--status-critical)'
                    : report.urgencyLevel === 'HIGH'
                      ? 'var(--status-high)'
                      : 'var(--primary)'
                }`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}
                >
                  {/* Category Badge */}
                  <span className="badge badge-medium">{report.category.replace('_', ' ')}</span>

                  {/* Urgency Badge (Icon + Text, never color alone) */}
                  <span className={`badge ${getUrgencyBadgeClass(report.urgencyLevel)}`}>
                    <Flame size={12} aria-hidden="true" />
                    <span>{report.urgencyLevel}</span>
                  </span>

                  {/* Status Badge */}
                  <span className="badge badge-low">
                    <CheckCircle size={12} aria-hidden="true" />
                    <span>{report.status}</span>
                  </span>

                  {/* Duplicate Indicator */}
                  {report.isDuplicate && (
                    <span
                      className="badge badge-high"
                      title="Auto-linked duplicate report within 200m radius"
                    >
                      <Copy size={12} aria-hidden="true" />
                      <span>Linked Duplicate</span>
                    </span>
                  )}
                </div>

                {/* Score & Timestamp */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}
                    >
                      Priority Score
                    </span>
                    <span
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color:
                          report.priorityScore >= 80
                            ? 'var(--status-critical)'
                            : report.priorityScore >= 60
                              ? 'var(--status-high)'
                              : 'var(--text-primary)',
                      }}
                    >
                      {report.priorityScore.toFixed(1)}/100
                    </span>
                  </div>

                  <Link
                    href={`/track/${encodeURIComponent(report.trackingId)}`}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', minHeight: '38px' }}
                    aria-label={`View public tracking page for ${report.title}`}
                  >
                    <span>Track</span>
                    <ChevronRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.35rem',
                  }}
                >
                  {report.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {report.description}
                </p>
              </div>

              {/* Footer Meta: Address, Ward, Tracking ID, Time */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.6rem',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
                >
                  {report.address && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={14} aria-hidden="true" />
                      <span>{report.address}</span>
                    </span>
                  )}
                  {report.ward && <span>• {report.ward}</span>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} aria-hidden="true" />
                    <span>{getRelativeTime(report.createdAt)}</span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    Ref: {report.trackingId}
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
