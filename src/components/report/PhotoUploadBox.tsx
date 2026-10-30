'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface PhotoUploadBoxProps {
  onImageUploaded: (url: string, suggestedAltText?: string) => void;
  onImageRemoved: () => void;
  imageUrl?: string;
  imageAltText?: string;
  onAltTextChange: (text: string) => void;
}

export function PhotoUploadBox({
  onImageUploaded,
  onImageRemoved,
  imageUrl,
  imageAltText,
  onAltTextChange,
}: PhotoUploadBoxProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // 1. Client-side size pre-check (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image exceeds the maximum allowed size of 5 MB.');
      return;
    }

    // 2. Client-side MIME check
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to upload photo');
      }

      onImageUploaded(data.url, `Citizen photo of ${file.name.replace(/\.[^/.]+$/, '')}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onImageRemoved();
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
      <label
        htmlFor="incident-photo-input"
        style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '0.4rem',
        }}
      >
        Incident Photograph (Optional, Max 5 MB)
      </label>

      {imageUrl ? (
        <div
          className="glass-card"
          style={{
            padding: '1rem',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
              <CheckCircle2 size={16} aria-hidden="true" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Photo securely processed & EXIF stripped
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', minHeight: '32px' }}
              aria-label="Remove uploaded image"
            >
              <X size={14} aria-hidden="true" />
              <span>Remove</span>
            </button>
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '180px',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              backgroundColor: '#0b0f19',
            }}
          >
            <Image
              src={imageUrl}
              alt={imageAltText || 'Preview of uploaded civic incident photo'}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 600px) 100vw, 400px"
            />
          </div>

          {/* Accessible Alternative Text Field */}
          <div>
            <label
              htmlFor="image-alt-text-input"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.25rem',
              }}
            >
              Image Description (Alt Text for Accessibility):
            </label>
            <input
              id="image-alt-text-input"
              type="text"
              value={imageAltText || ''}
              onChange={(e) => onAltTextChange(e.target.value)}
              placeholder="e.g. Deep pothole next to storm drain on left lane"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>
        </div>
      ) : (
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Click or press enter to upload an incident photo"
            style={{
              border: '2px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '1.75rem 1rem',
              textAlign: 'center',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              backgroundColor: 'rgba(17, 24, 39, 0.4)',
              transition: 'border-color 0.2s ease, background-color 0.2s ease',
            }}
          >
            <input
              id="incident-photo-input"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={isUploading}
              style={{ display: 'none' }}
              aria-describedby={errorMessage ? 'photo-upload-error' : undefined}
            />

            {isUploading ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Loader2
                  size={28}
                  className="animate-spin"
                  color="var(--primary)"
                  aria-hidden="true"
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Validating format & stripping EXIF coordinates...
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <Upload size={20} aria-hidden="true" />
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    Click to upload photo
                  </span>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>or drag and drop</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  JPEG, PNG, or WebP • Max 5 MB • Automatically sanitized
                </span>
              </div>
            )}
          </div>

          {errorMessage && (
            <div
              id="photo-upload-error"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--status-critical)',
                fontSize: '0.8rem',
                marginTop: '0.4rem',
              }}
              role="alert"
            >
              <AlertCircle size={14} aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
