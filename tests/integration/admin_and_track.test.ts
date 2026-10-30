import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH as updateReportStatus } from '@/app/api/reports/[id]/route';
import { GET as trackReport } from '@/app/api/track/[trackingId]/route';
import { signRole } from '@/lib/security/auth';
import { prisma } from '@/lib/db/prisma';
import { CONFIG } from '@/lib/config';

describe('Admin Authorization & Public Track API (Integration)', () => {
  it('rejects PATCH /api/reports/[id] with 403 when caller is not an ADMIN', async () => {
    // Look up an existing report
    const report = await prisma.report.findFirst();
    expect(report).toBeDefined();

    const req = new NextRequest(`http://localhost:3000/api/reports/${report!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'ASSIGNED',
        assignedDept: 'ROADS_AND_BRIDGES',
      }),
    });

    const res = await updateReportStatus(req, { params: Promise.resolve({ id: report!.id }) });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('rejects status transition to RESOLVED without mandatory note (400 Bad Request)', async () => {
    const report = await prisma.report.findFirst();
    const adminCookie = signRole('ADMIN');

    const req = new NextRequest(`http://localhost:3000/api/reports/${report!.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        // Missing note
      }),
    });
    req.cookies.set(CONFIG.SECURITY.COOKIE_NAME, adminCookie);

    const res = await updateReportStatus(req, { params: Promise.resolve({ id: report!.id }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('successfully updates status and records audit history when called with signed ADMIN role', async () => {
    const report = await prisma.report.findFirst();
    const adminCookie = signRole('ADMIN');

    const req = new NextRequest(`http://localhost:3000/api/reports/${report!.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'IN_PROGRESS',
        assignedDept: 'ROADS_AND_BRIDGES',
        assignedTeam: 'Unit Bravo 4',
        note: 'Assigned crew Unit Bravo 4 dispatched with heavy patcher machinery.',
      }),
    });
    req.cookies.set(CONFIG.SECURITY.COOKIE_NAME, adminCookie);

    const res = await updateReportStatus(req, { params: Promise.resolve({ id: report!.id }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.report.status).toBe('IN_PROGRESS');

    // Verify history was appended
    const updatedHistory = await prisma.statusHistory.findFirst({
      where: { reportId: report!.id, toStatus: 'IN_PROGRESS' },
      orderBy: { createdAt: 'desc' },
    });
    expect(updatedHistory).toBeDefined();
    expect(updatedHistory!.note).toContain('Unit Bravo 4');
  });

  it('GET /api/track/[trackingId] returns safe projection and strictly strips reporter PII', async () => {
    const report = await prisma.report.findFirst();
    expect(report).toBeDefined();

    const req = new NextRequest(`http://localhost:3000/api/track/${report!.trackingId}`);
    const res = await trackReport(req, { params: Promise.resolve({ trackingId: report!.trackingId }) });

    expect(res.status).toBe(200);
    const json = await res.json();
    const trackData = json.report;

    expect(trackData.trackingId).toBe(report!.trackingId);
    expect(trackData.title).toBe(report!.title);
    expect(trackData.status).toBeDefined();

    // Verify PII is NOT present
    expect(trackData.reporterName).toBeUndefined();
    expect(trackData.reporterPhone).toBeUndefined();

    // Verify coordinates are rounded to 2 decimal places
    const latDecimals = (trackData.approxLocation.latitude.toString().split('.')[1] || '').length;
    expect(latDecimals).toBeLessThanOrEqual(2);
  });
});
