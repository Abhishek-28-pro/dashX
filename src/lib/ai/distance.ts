/**
 * Geodesic Distance and Spatial Bounding Box Calculations
 * Pure mathematical functions implementing the Haversine formula and spherical bounding boxes.
 * Zero database, network, or external dependencies.
 */

import type { BoundingBox, GeoCoordinates } from '@/types';

// Earth radius in meters (mean radius defined by IUGG)
const EARTH_RADIUS_METERS = 6371000;

/**
 * Converts degrees to radians.
 *
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the great-circle distance between two geographic coordinates using the Haversine formula.
 *
 * Why it works:
 * The Earth is approximated as a sphere. The Haversine formula accounts for spherical curvature
 * using the sine-squared of half the angle differences, avoiding floating point inaccuracies
 * for small distances between city streets.
 *
 * @param point1 - First coordinate { latitude, longitude }
 * @param point2 - Second coordinate { latitude, longitude }
 * @returns Geodesic distance in meters
 */
export function calculateHaversineDistance(point1: GeoCoordinates, point2: GeoCoordinates): number {
  const dLat = degreesToRadians(point2.latitude - point1.latitude);
  const dLng = degreesToRadians(point2.longitude - point1.longitude);

  const lat1Rad = degreesToRadians(point1.latitude);
  const lat2Rad = degreesToRadians(point2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Computes a rectangular bounding box around a center coordinate given a search radius in meters.
 *
 * Why it works:
 * Before performing expensive vector similarity or clustering on every report in the database,
 * this function generates min/max latitude and longitude boundaries.
 * We can filter candidate reports via indexed SQL columns in O(log N) time,
 * pruning 99% of irrelevant reports before calculating exact distance or similarity.
 *
 * @param center - Center coordinate { latitude, longitude }
 * @param radiusMeters - Search radius in meters
 * @returns Bounding box with minLat, maxLat, minLng, maxLng
 */
export function calculateBoundingBox(center: GeoCoordinates, radiusMeters: number): BoundingBox {
  // 1 degree of latitude is approximately 111,111 meters everywhere
  const latDelta = radiusMeters / 111111;

  // 1 degree of longitude scales with the cosine of the latitude
  const latRad = degreesToRadians(center.latitude);
  const lngDelta = radiusMeters / (111111 * Math.cos(latRad) || 1);

  return {
    minLat: Math.max(-90, center.latitude - latDelta),
    maxLat: Math.min(90, center.latitude + latDelta),
    minLng: Math.max(-180, center.longitude - lngDelta),
    maxLng: Math.min(180, center.longitude + lngDelta),
  };
}

/**
 * Computes the geographic centroid of a cluster of points.
 *
 * @param points - Array of coordinates
 * @returns Centroid { latitude, longitude }
 */
export function calculateCentroid(points: GeoCoordinates[]): GeoCoordinates {
  if (points.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  let totalLat = 0;
  let totalLng = 0;

  for (const point of points) {
    totalLat += point.latitude;
    totalLng += point.longitude;
  }

  return {
    latitude: totalLat / points.length,
    longitude: totalLng / points.length,
  };
}
