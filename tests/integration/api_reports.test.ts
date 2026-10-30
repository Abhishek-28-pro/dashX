import { describe, it, expect } from 'vitest';
import { GET as getReports } from '@/app/api/reports/route';
import { GET as getStats } from '@/app/api/stats/route';
import { GET as getHotspots } from '@/app/api/hotspots/route';
import { NextRequest } from 'next/server';

describe('Reports & Stats API Endpoints (Integration)', () => {
  it('GET /api/reports returns paginated list of reports', async () => {
    const req = new NextRequest('http://localhost:3000/api/reports?page=1&limit=5');
    const res = await getReports(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(json.reports)).toBe(true);
    expect(json.pagination).toBeDefined();
    expect(json.pagination.page).toBe(1);
    expect(json.pagination.limit).toBe(5);
  });

  it('GET /api/reports filters correctly by category', async () => {
    const req = new NextRequest('http://localhost:3000/api/reports?category=POTHOLE');
    const res = await getReports(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.reports.length).toBeGreaterThan(0);
    for (const report of json.reports) {
      expect(report.category).toBe('POTHOLE');
    }
  });

  it('GET /api/stats returns cached aggregates with resolution rates', async () => {
    const res = await getStats();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.totalReports).toBeGreaterThanOrEqual(1);
    expect(json.resolutionRatePercent).toBeDefined();
    expect(typeof json.activeHotspotsCount).toBe('number');
  });

  it('GET /api/hotspots clusters reports and generates action briefs', async () => {
    const res = await getHotspots();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(json.hotspots)).toBe(true);
    if (json.hotspots.length > 0) {
      const first = json.hotspots[0];
      expect(first.actionBrief).toBeDefined();
      expect(first.reportCount).toBeGreaterThanOrEqual(3);
    }
  });
});
