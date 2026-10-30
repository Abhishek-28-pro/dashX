import { NextRequest, NextResponse } from 'next/server';
import { signRole } from '@/lib/security/auth';
import { CONFIG } from '@/lib/config';
import type { UserRole } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role: UserRole = body.role === 'ADMIN' ? 'ADMIN' : 'CITIZEN';

    const signedCookieValue = signRole(role);

    const response = NextResponse.json({
      success: true,
      role,
      message: 'MOCKED auth role updated (demonstration only)',
    });

    response.cookies.set({
      name: CONFIG.SECURITY.COOKIE_NAME,
      value: signedCookieValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Failed to set mock role' } },
      { status: 400 }
    );
  }
}
