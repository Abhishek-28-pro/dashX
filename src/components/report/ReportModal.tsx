'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { IssueCategories, type IssueCategory } from '@/types';
import { PhotoUploadBox } from './PhotoUploadBox';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Copy,
  MapPin,
  Flame,
  Building,
  Navigation,
  Loader2,
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated?: () => void;
}

interface SubmittedReportSummary {
  trackingId: string;
  isDuplicate: boolean;
  priorityScore: number;
  urgencyLevel: string;
  assignedDept?: string;
  aiSummary?: string;
}

export function ReportModal({ isOpen, onClose, onReportCreated }: ReportModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('POTHOLE');
  const [latitude, setLatitude] = useState('28.6315');
  const [longitude, setLongitude] = useState('77.2167');
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('Ward 14 - Central');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAltText, setImageAltText] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  // Honeypot field (must remain empty for humans)
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');

  // UI Flow State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedSummary, setSubmittedSummary] = useState<SubmittedReportSummary | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Save previous focus on modal open & restore on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus modal container or first input
      setTimeout(() => {
        const firstInput = modalRef.current?.querySelector<HTMLElement>(
          'input, select, textarea, button'
        );
        firstInput?.focus();
      }, 50);

      // Disable body scrolling
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Handle Escape key to close modal & focus trapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Geolocation detection handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, location: 'Geolocation is not supported by your browser.' }));
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setDetectingLocation(false);
        setErrors((prev) => {
          const next = { ...prev };
          delete next.location;
          return next;
        });
      },
      () => {
        setDetectingLocation(false);
        setErrors((prev) => ({
          ...prev,
          location: 'Unable to retrieve location. Please input coordinates manually.',
        }));
      },
      { timeout: 8000 }
    );
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side quick checks
    const newErrors: Record<string, string> = {};
    if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters.';
    }
    if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters.';
    }
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      newErrors.latitude = 'Latitude must be between -90 and 90.';
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      newErrors.longitude = 'Longitude must be between -180 and 180.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        latitude: latNum,
        longitude: lngNum,
        address: address.trim() || undefined,
        ward: ward.trim() || undefined,
        imageUrl: imageUrl || undefined,
        imageAltText: imageAltText.trim() || undefined,
        reporterName: reporterName.trim() || undefined,
        reporterPhone: reporterPhone.trim() || undefined,
        website: websiteHoneypot, // Honeypot field
      };

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to submit report');
      }

      setSubmittedSummary({
        trackingId: data.trackingId,
        isDuplicate: data.isDuplicate,
        priorityScore: data.report.priorityScore,
        urgencyLevel: data.report.urgencyLevel,
        assignedDept: data.report.assignedDept,
        aiSummary: data.report.aiSummary,
      });

      onReportCreated?.();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Submission failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTrackingId = () => {
    if (submittedSummary?.trackingId) {
      navigator.clipboard.writeText(submittedSummary.trackingId);
      setCopiedTrackingId(true);
      setTimeout(() => setCopiedTrackingId(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <h2
              id="report-modal-title"
              style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}
            >
              {submittedSummary
                ? 'Report Submitted & Triaged'
                : 'Report Civic Infrastructure Issue'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {submittedSummary
                ? 'Your incident reference code and immediate AI triage classification'
                : 'Help municipal crews triage and repair community hazards quickly'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', borderRadius: '50%', minHeight: '36px', minWidth: '36px' }}
            aria-label="Close modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {submittedSummary ? (
            /* Confirmation Panel */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#86efac',
                }}
              >
                <CheckCircle2 size={24} aria-hidden="true" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    Incident Successfully Registered
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                    Your report is queued in the municipal dispatch system.
                  </div>
                </div>
              </div>

              {/* Unguessable Tracking Code Box */}
              <div
                className="glass-card"
                style={{
                  padding: '1.25rem',
                  textAlign: 'center',
                  backgroundColor: 'rgba(11, 15, 25, 0.9)',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
                  Your Permanent Tracking ID:
                </span>
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    color: 'var(--primary)',
                    fontFamily: 'var(--font-mono)',
                    margin: '0.5rem 0 1rem',
                  }}
                >
                  {submittedSummary.trackingId}
                </div>
                <button
                  type="button"
                  onClick={handleCopyTrackingId}
                  className="btn btn-secondary"
                  style={{ minHeight: '40px', margin: '0 auto' }}
                >
                  <Copy size={16} aria-hidden="true" />
                  <span>{copiedTrackingId ? 'Copied to Clipboard!' : 'Copy Tracking ID'}</span>
                </button>
              </div>

              {/* Duplicate Notice Banner */}
              {submittedSummary.isDuplicate && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(249, 115, 22, 0.15)',
                    border: '1px solid rgba(249, 115, 22, 0.4)',
                    color: '#fdba74',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Linked Duplicate Detected:</strong> A similar issue was already reported
                  within 200 meters. Your report has been corroborated and linked to elevate team
                  dispatch priority!
                </div>
              )}

              {/* AI Triage Classification Summary */}
              <div
                className="glass-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Automated AI Triage Assessment:
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <span
                      style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}
                    >
                      Calculated Priority
                    </span>
                    <span
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color:
                          submittedSummary.priorityScore >= 80
                            ? 'var(--status-critical)'
                            : 'var(--primary)',
                      }}
                    >
                      {submittedSummary.priorityScore.toFixed(1)}/100
                    </span>
                  </div>

                  <div>
                    <span
                      style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}
                    >
                      Urgency Classification
                    </span>
                    <span
                      className={`badge ${
                        submittedSummary.urgencyLevel === 'CRITICAL'
                          ? 'badge-critical'
                          : 'badge-high'
                      }`}
                      style={{ marginTop: '0.2rem' }}
                    >
                      <Flame size={12} aria-hidden="true" />
                      <span>{submittedSummary.urgencyLevel}</span>
                    </span>
                  </div>

                  <div>
                    <span
                      style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}
                    >
                      Assigned Department
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        marginTop: '0.2rem',
                      }}
                    >
                      <Building size={14} aria-hidden="true" />
                      <span>{submittedSummary.assignedDept || 'General Maintenance'}</span>
                    </div>
                  </div>
                </div>

                {submittedSummary.aiSummary && (
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <strong>AI Executive Summary:</strong> {submittedSummary.aiSummary}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  marginTop: '0.5rem',
                }}
              >
                <Link
                  href={`/track/${encodeURIComponent(submittedSummary.trackingId)}`}
                  className="btn btn-primary"
                  onClick={onClose}
                >
                  Track Live Status
                </Link>
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} noValidate>
              {/* Form Level Error Alert */}
              {errors.form && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                  }}
                  role="alert"
                >
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* Honeypot field for bot deterrence - hidden from humans */}
              <div
                style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
                aria-hidden="true"
              >
                <label htmlFor="website-honeypot">Leave this field blank</label>
                <input
                  id="website-honeypot"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={websiteHoneypot}
                  onChange={(e) => setWebsiteHoneypot(e.target.value)}
                />
              </div>

              {/* Title Field */}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="report-title-input"
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '0.35rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  Issue Title <span style={{ color: 'var(--status-critical)' }}>*</span>
                </label>
                <input
                  id="report-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deep pothole causing vehicular damage near Metro Gate 3"
                  aria-describedby={errors.title ? 'title-error' : undefined}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${errors.title ? 'var(--status-critical)' : 'var(--border-medium)'}`,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    minHeight: '44px',
                  }}
                />
                {errors.title && (
                  <div
                    id="title-error"
                    style={{
                      color: 'var(--status-critical)',
                      fontSize: '0.8rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    {errors.title}
                  </div>
                )}
              </div>

              {/* Category & Ward Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                {/* Category Select */}
                <div>
                  <label
                    htmlFor="report-category-select"
                    style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      marginBottom: '0.35rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Category <span style={{ color: 'var(--status-critical)' }}>*</span>
                  </label>
                  <select
                    id="report-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IssueCategory)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      minHeight: '44px',
                    }}
                  >
                    {IssueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ward Select */}
                <div>
                  <label
                    htmlFor="report-ward-select"
                    style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      marginBottom: '0.35rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Municipal Ward
                  </label>
                  <select
                    id="report-ward-select"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      minHeight: '44px',
                    }}
                  >
                    <option value="Ward 14 - Central">Ward 14 - Central</option>
                    <option value="Ward 08 - West">Ward 08 - West</option>
                    <option value="Ward 21 - South">Ward 21 - South</option>
                    <option value="Ward 03 - North">Ward 03 - North</option>
                  </select>
                </div>
              </div>

              {/* Description Field */}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="report-description-input"
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '0.35rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  Description (10 to 2000 characters){' '}
                  <span style={{ color: 'var(--status-critical)' }}>*</span>
                </label>
                <textarea
                  id="report-description-input"
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the exact location, visual appearance, and immediate dangers..."
                  aria-describedby={errors.description ? 'description-error' : undefined}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${errors.description ? 'var(--status-critical)' : 'var(--border-medium)'}`,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                  }}
                />
                {errors.description && (
                  <div
                    id="description-error"
                    style={{
                      color: 'var(--status-critical)',
                      fontSize: '0.8rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    {errors.description}
                  </div>
                )}
              </div>

              {/* Geolocation Section */}
              <div
                className="glass-card"
                style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  backgroundColor: 'rgba(11, 15, 25, 0.6)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontWeight: 600,
                    }}
                  >
                    <MapPin size={16} color="var(--primary)" aria-hidden="true" />
                    <span>Location Coordinates</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', minHeight: '34px' }}
                  >
                    {detectingLocation ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Navigation size={14} aria-hidden="true" />
                    )}
                    <span>{detectingLocation ? 'Detecting...' : 'Detect GPS Location'}</span>
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <label
                      htmlFor="report-latitude-input"
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.2rem',
                      }}
                    >
                      Latitude (-90 to 90)
                    </label>
                    <input
                      id="report-latitude-input"
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="report-longitude-input"
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.2rem',
                      }}
                    >
                      Longitude (-180 to 180)
                    </label>
                    <input
                      id="report-longitude-input"
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                </div>

                {/* Optional Landmark / Street Address */}
                <div style={{ marginTop: '0.75rem' }}>
                  <label
                    htmlFor="report-address-input"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Street Address or Nearest Landmark
                  </label>
                  <input
                    id="report-address-input"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Outer Circle, Opp. Standard Chartered Bank"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              {/* Photo Upload with EXIF Stripping & Alt text */}
              <PhotoUploadBox
                imageUrl={imageUrl}
                imageAltText={imageAltText}
                onImageUploaded={(url, suggestedAlt) => {
                  setImageUrl(url);
                  if (suggestedAlt) setImageAltText(suggestedAlt);
                }}
                onImageRemoved={() => {
                  setImageUrl('');
                  setImageAltText('');
                }}
                onAltTextChange={(text) => setImageAltText(text)}
              />

              {/* Optional Reporter Details (Privacy preserved) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <label
                    htmlFor="reporter-name-input"
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Your Name (Optional, kept private)
                  </label>
                  <input
                    id="reporter-name-input"
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="reporter-phone-input"
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Phone Number (Optional, for SMS updates)
                  </label>
                  <input
                    id="reporter-phone-input"
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              {/* Submit Button & Cancellation */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '1rem',
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ minWidth: '160px' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      <span>Submitting & Triaging...</span>
                    </>
                  ) : (
                    <span>Submit Report</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
