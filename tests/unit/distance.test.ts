import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistance,
  calculateBoundingBox,
  calculateCentroid,
} from '@/lib/ai/distance';

describe('Distance & Spatial Math (Pure Logic)', () => {
  it('returns 0 for identical points', () => {
    const p = { latitude: 28.6139, longitude: 77.209 };
    const dist = calculateHaversineDistance(p, p);
    expect(dist).toBe(0);
  });

  it('accurately calculates distance between known landmarks (Connaught Place to India Gate ~ 2.4 km)', () => {
    const cp = { latitude: 28.6315, longitude: 77.2167 };
    const indiaGate = { latitude: 28.6129, longitude: 77.2295 };

    const dist = calculateHaversineDistance(cp, indiaGate);
    // Expected distance is approximately 2300 - 2500 meters
    expect(dist).toBeGreaterThan(2200);
    expect(dist).toBeLessThan(2600);
  });

  it('calculates bounding box that contains the original point and adheres to radius', () => {
    const center = { latitude: 28.6315, longitude: 77.2167 };
    const radiusMeters = 200;

    const bbox = calculateBoundingBox(center, radiusMeters);

    expect(bbox.minLat).toBeLessThan(center.latitude);
    expect(bbox.maxLat).toBeGreaterThan(center.latitude);
    expect(bbox.minLng).toBeLessThan(center.longitude);
    expect(bbox.maxLng).toBeGreaterThan(center.longitude);
  });

  it('calculates centroid of multiple points correctly', () => {
    const points = [
      { latitude: 10, longitude: 20 },
      { latitude: 20, longitude: 40 },
    ];
    const centroid = calculateCentroid(points);
    expect(centroid.latitude).toBe(15);
    expect(centroid.longitude).toBe(30);
  });
});
