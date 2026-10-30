import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { trackReportSchema } from '@/lib/validation';
import { notFound } from 'next/navigation';
import { CheckCircle2, Clock, MapPin, Flame, ArrowLeft, Calendar, AlertCircle } from 'lucide-react';
import type { IssueStatus } from '@/types';

export const dynamic = 'force-dynamic';

const STATUS_STEPS: IssueStatus[] = ['SUBMITTED', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ trackingId: string }>;
}) {
  const { trackingId } = await params;

  const validated = trackReportSchema.safeParse({ trackingId });
  if (!validated.success) {
    notFound();
  }

  const report = await prisma.report.findUnique({
    where: { trackingId: validated.data.trackingId },
    include: {
      statusHistory: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!report) {
    return (
      <div className="container" style={{ padding: '3.5rem 1.5rem', maxWidth: '640px' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <AlertCircle
            size={40}
            style={{ color: 'var(--status-critical)', margin: '0 auto 1rem' }}
          />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Report Reference Not Found
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            No incident matching reference ID <strong>{trackingId}</strong> exists in the municipal
            dispatch database.
          </p>
          <Link href="/track" className="btn btn-secondary">
            Search Another Reference Code
          </Link>
        </div>
      </div>
    );
  }

  // Calculate current step index
  const currentStepIndex = STATUS_STEPS.indexOf(report.status as IssueStatus);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem', maxWidth: '780px' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          href="/track"
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Look Up Another Incident</span>
        </Link>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '1.25rem',
            marginBottom: '1.75rem',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.4rem',
              }}
            >
              <span className="badge badge-medium">{report.category}</span>
              <span className="badge badge-critical">
                <Flame size={12} aria-hidden="true" />
                <span>{report.urgencyLevel}</span>
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{report.title}</h1>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
              Tracking Reference Code
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.25rem',
                fontWeight: 900,
                color: 'var(--primary)',
              }}
            >
              {report.trackingId}
            </span>
          </div>
        </div>

        {/* Visual Progress Stepper */}
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
            }}
          >
            Lifecycle Dispatch Progress:
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  key={step}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                      color: isCompleted ? 'var(--text-inverse)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      border: `2px solid ${isCurrent ? '#ffffff' : 'transparent'}`,
                      boxShadow: isCurrent ? 'var(--shadow-glow)' : 'none',
                    }}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCompleted ? 'var(--text-primary)' : 'var(--text-muted)',
                      marginTop: '0.4rem',
                      textAlign: 'center',
                    }}
                  >
                    {step.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Public Metadata (Safe Projection, No PII) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(11, 15, 25, 0.7)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.75rem',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
              }}
            >
              <Calendar size={14} aria-hidden="true" />
              <span>Reported Date</span>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.2rem' }}>
              {new Date(report.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
              }}
            >
              <MapPin size={14} aria-hidden="true" />
              <span>Approximate Location</span>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.2rem' }}>
              {report.ward || 'Central Ward'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Lat: {report.latitude.toFixed(2)}, Lng: {report.longitude.toFixed(2)}
            </div>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
              }}
            >
              <Clock size={14} aria-hidden="true" />
              <span>Status Last Updated</span>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.2rem' }}>
              {new Date(report.updatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {/* Public Activity Timeline */}
        <section aria-labelledby="timeline-heading">
          <h2
            id="timeline-heading"
            style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}
          >
            Resolution Updates & Public Notes
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {report.statusHistory.map((history) => (
              <div
                key={history.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderLeft: '3px solid var(--primary)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.25rem',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {history.toStatus}
                  </span>
                  <span>
                    {new Date(history.createdAt).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {history.note || `Incident progressed to ${history.toStatus}.`}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
