/**
 * MOCKED Authentication & Role Management (For Demonstration Purposes Only)
 *
 * NOTE: MOCKED auth, not production-grade.
 * In a real production deployment, integrate OAuth2, OpenID Connect, or NextAuth with signed JWTs.
 *
 * Uses HMAC-SHA256 signatures stored in an httpOnly cookie to prevent client tampering.
 */

import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { AppError } from '@/lib/errors';
import { CONFIG } from '@/lib/config';
import type { UserRole } from '@/types';

const SECRET_KEY =
  process.env.MOCK_AUTH_SECRET || 'promptwars-astra-mock-secret-key-change-in-prod-32bytes';

/**
 * Signs a role string using HMAC-SHA256.
 *
 * @param role - 'CITIZEN' | 'ADMIN'
 * @returns Signed cookie value in format `${role}.${signature}`
 */
export function signRole(role: UserRole): string {
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(role);
  const signature = hmac.digest('hex');
  return `${role}.${signature}`;
}

/**
 * Verifies the signature of a role cookie.
 *
 * @param cookieValue - Signed cookie string
 * @returns Verified UserRole or null if invalid/tampered
 */
export function verifyRole(cookieValue?: string | null): UserRole | null {
  if (!cookieValue) return null;

  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;

  const [role, providedSignature] = parts;
  if (role !== 'CITIZEN' && role !== 'ADMIN') return null;

  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(role);
  const expectedSignature = hmac.digest('hex');

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(providedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    return isValid ? (role as UserRole) : null;
  } catch {
    return null;
  }
}

/**
 * Retrieves the current user role from request cookies or server cookies.
 * Defaults to 'CITIZEN' if no valid cookie is found.
 */
export async function getCurrentRole(req?: NextRequest): Promise<UserRole> {
  let cookieVal: string | undefined;

  if (req) {
    cookieVal = req.cookies.get(CONFIG.SECURITY.COOKIE_NAME)?.value;
    if (!cookieVal) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(
        new RegExp(`(?:^|;\\s*)${CONFIG.SECURITY.COOKIE_NAME}=([^;]+)`)
      );
      if (match) cookieVal = match[1];
    }
  } else {
    try {
      // Dynamic import to avoid crash in standalone unit test runs
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      cookieVal = cookieStore.get(CONFIG.SECURITY.COOKIE_NAME)?.value;
    } catch {
      cookieVal = undefined;
    }
  }

  const role = verifyRole(cookieVal);
  return role ?? 'CITIZEN';
}

/**
 * Server-side authorization guard.
 * Throws AppError(FORBIDDEN) if caller is not an ADMIN.
 */
export async function requireAdminRole(req?: NextRequest): Promise<void> {
  const role = await getCurrentRole(req);
  if (role !== 'ADMIN') {
    throw new AppError(
      'Access denied: Administrator privileges required for this action',
      'FORBIDDEN',
      403
    );
  }
}
