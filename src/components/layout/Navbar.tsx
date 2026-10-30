'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from './LanguageContext';
import { ShieldAlert, Globe, UserCheck } from 'lucide-react';

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<'CITIZEN' | 'ADMIN'>('ADMIN');

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const toggleRole = async () => {
    const newRole = currentRole === 'ADMIN' ? 'CITIZEN' : 'ADMIN';
    setCurrentRole(newRole);
    try {
      await fetch('/api/auth/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
    } catch {
      // Mock toggle fallback
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px',
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            color: 'inherit',
          }}
          aria-label={t.appName}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
            }}
          >
            <ShieldAlert size={24} aria-hidden="true" />
          </div>
          <div>
            <span
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #f8fafc, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'block',
              }}
            >
              {t.appName}
            </span>
          </div>
        </Link>

        {/* Semantic Navigation */}
        <nav aria-label="Main Navigation">
          <ul
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              listStyle: 'none',
            }}
          >
            <li>
              <Link
                href="/"
                style={{
                  color: pathname === '/' ? 'var(--primary)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontWeight: pathname === '/' ? 700 : 500,
                  fontSize: '0.95rem',
                }}
              >
                {t.nav.home}
              </Link>
            </li>
            <li>
              <Link
                href="/track"
                style={{
                  color: pathname.startsWith('/track') ? 'var(--primary)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontWeight: pathname.startsWith('/track') ? 700 : 500,
                  fontSize: '0.95rem',
                }}
              >
                {t.nav.track}
              </Link>
            </li>
            <li>
              <Link
                href="/maps"
                style={{
                  color: pathname === '/maps' ? 'var(--primary)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontWeight: pathname === '/maps' ? 700 : 500,
                  fontSize: '0.95rem',
                }}
              >
                {t.nav.maps}
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                style={{
                  color: pathname.startsWith('/admin') ? 'var(--primary)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontWeight: pathname.startsWith('/admin') ? 700 : 500,
                  fontSize: '0.95rem',
                }}
              >
                {t.nav.admin}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Controls: Language & Mock Role Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Language Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="btn btn-secondary"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.85rem',
              minHeight: '40px',
            }}
            aria-label={`Switch language to ${language === 'en' ? 'Hindi' : 'English'}`}
          >
            <Globe size={16} aria-hidden="true" />
            <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
          </button>

          {/* Role Switcher Demo */}
          <button
            type="button"
            onClick={toggleRole}
            className="btn"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.85rem',
              minHeight: '40px',
              backgroundColor:
                currentRole === 'ADMIN' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              color: currentRole === 'ADMIN' ? 'var(--primary)' : 'var(--text-secondary)',
              border: `1px solid ${currentRole === 'ADMIN' ? 'var(--primary)' : 'var(--border-subtle)'}`,
            }}
            title="MOCKED auth, not production-grade"
            aria-label={`Role: ${currentRole}. Click to toggle.`}
          >
            <UserCheck size={16} aria-hidden="true" />
            <span>{currentRole === 'ADMIN' ? t.roles.admin : t.roles.citizen}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
