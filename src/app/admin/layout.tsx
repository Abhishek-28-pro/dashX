import React from 'react';
import { getCurrentRole } from '@/lib/security/auth';
import { ShieldAlert, UserCheck } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentRole();
  const isAdmin = role === 'ADMIN';

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      {/* Demo Mock Auth Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: isAdmin ? 'rgba(56, 189, 248, 0.12)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${isAdmin ? 'rgba(56, 189, 248, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`,
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {isAdmin ? (
            <UserCheck size={18} color="var(--primary)" aria-hidden="true" />
          ) : (
            <ShieldAlert size={18} color="var(--status-critical)" aria-hidden="true" />
          )}
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {isAdmin
              ? 'Administrator Access Active (Server-Side Verified)'
              : 'Citizen Role Active: Admin console is in read-only mode for unauthorized callers'}
          </span>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          MOCKED auth, not production-grade • Toggle role in top navbar
        </div>
      </div>

      {children}
    </div>
  );
}
