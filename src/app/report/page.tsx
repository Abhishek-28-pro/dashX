'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IssueCategories, type IssueCategory } from '@/types';
import { PhotoUploadBox } from '@/components/report/PhotoUploadBox';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  MapPin,
  Flame,
  Building,
  Navigation,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

interface SubmittedReportSummary {
  trackingId: string;
  isDuplicate: boolean;
  priorityScore: number;
  urgencyLevel: string;
  assignedDept?: string;
  aiSummary?: string;
}

export default function ReportPage() {
  const router = useRouter();

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
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');

  // UI Flow State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedSummary, setSubmittedSummary] = useState<SubmittedReportSummary | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

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
        website: websiteHoneypot,
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

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem', maxWidth: '780px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back</span>
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {submittedSummary ? 'Report Submitted & Triaged' : 'Submit Civic Incident Report'}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
          {submittedSummary
            ? 'Your complaint is active in the municipal triage dispatch queue'
            : 'Fill in details below to alert local municipal response crews'}
        </p>

        {submittedSummary ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                  Your report has been enriched with AI metadata and queued.
                </div>
              </div>
            </div>

            <div
              className="glass-card"
              style={{
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: 'rgba(11, 15, 25, 0.9)',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
                Your Permanent Tracking ID:
              </span>
              <div
                style={{
                  fontSize: '2rem',
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

            {submittedSummary.isDuplicate && (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(249, 115, 22, 0.15)',
                  border: '1px solid rgba(249, 115, 22, 0.4)',
                  color: '#fdba74',
                  fontSize: '0.9rem',
                }}
              >
                <strong>Linked Duplicate Detected:</strong> A corroborating report exists within
                200m. Your report has been clustered to raise its priority score!
              </div>
            )}

            <div
              className="glass-card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                Automated Dispatch Classification:
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
                    Priority Score
                  </span>
                  <span
                    style={{
                      fontSize: '1.2rem',
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
                    Urgency Level
                  </span>
                  <span
                    className={`badge ${
                      submittedSummary.urgencyLevel === 'CRITICAL' ? 'badge-critical' : 'badge-high'
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
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      marginTop: '0.2rem',
                    }}
                  >
                    <Building size={14} aria-hidden="true" />
                    <span>{submittedSummary.assignedDept || 'General Maintenance'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              <Link href="/" className="btn btn-secondary">
                Return Home
              </Link>
              <Link
                href={`/track/${encodeURIComponent(submittedSummary.trackingId)}`}
                className="btn btn-primary"
              >
                Track Live Status
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
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

            {/* Honeypot */}
            <div
              style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
              aria-hidden="true"
            >
              <label htmlFor="website-honeypot-page">Leave this blank</label>
              <input
                id="website-honeypot-page"
                type="text"
                tabIndex={-1}
                value={websiteHoneypot}
                onChange={(e) => setWebsiteHoneypot(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="page-title-input"
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '0.35rem',
                }}
              >
                Issue Title <span style={{ color: 'var(--status-critical)' }}>*</span>
              </label>
              <input
                id="page-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Broken streetlight on 2nd crossroad causing unsafe dark street"
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

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <label
                  htmlFor="page-category-select"
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '0.35rem',
                  }}
                >
                  Category <span style={{ color: 'var(--status-critical)' }}>*</span>
                </label>
                <select
                  id="page-category-select"
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

              <div>
                <label
                  htmlFor="page-ward-select"
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '0.35rem',
                  }}
                >
                  Municipal Ward
                </label>
                <select
                  id="page-ward-select"
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

            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="page-desc-input"
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '0.35rem',
                }}
              >
                Description (10 to 2000 chars){' '}
                <span style={{ color: 'var(--status-critical)' }}>*</span>
              </label>
              <textarea
                id="page-desc-input"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, physical hazards, and how long it has been occurring..."
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
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
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
                    htmlFor="page-lat-input"
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
                    id="page-lat-input"
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
                    htmlFor="page-lng-input"
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
                    id="page-lng-input"
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

              <div style={{ marginTop: '0.75rem' }}>
                <label
                  htmlFor="page-address-input"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.2rem',
                  }}
                >
                  Street Address / Landmark
                </label>
                <input
                  id="page-address-input"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Metro Gate 3, Connaught Place"
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

            <PhotoUploadBox
              imageUrl={imageUrl}
              imageAltText={imageAltText}
              onImageUploaded={(url, alt) => {
                setImageUrl(url);
                if (alt) setImageAltText(alt);
              }}
              onImageRemoved={() => {
                setImageUrl('');
                setImageAltText('');
              }}
              onAltTextChange={(alt) => setImageAltText(alt)}
            />

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
                  htmlFor="page-reporter-name-input"
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
                  id="page-reporter-name-input"
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
                  htmlFor="page-reporter-phone-input"
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
                  id="page-reporter-phone-input"
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

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '1.5rem',
              }}
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ minWidth: '180px' }}
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
  );
}
