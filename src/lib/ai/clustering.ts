/**
 * Density-Based Incident Hotspot Clustering
 *
 * Why it works:
 * Rather than analyzing civic issues in isolation, municipal response teams achieve
 * maximum operational efficiency by identifying localized clusters ("hotspots").
 *
 * This pure algorithm implements a spatial density grouping:
 * 1. Iterates over unassigned incidents.
 * 2. Finds all neighbors within `CONFIG.CLUSTERING.RADIUS_METERS` (350 meters) of the same category/ward.
 * 3. If neighbor count >= `CONFIG.CLUSTERING.MIN_REPORTS_FOR_HOTSPOT` (3 reports),
 *    forms an active Hotspot Cluster, computes the geographic centroid, and aggregates severity.
 * 4. Zero DB queries or network calls.
 */

import { CONFIG } from '@/lib/config';
import { calculateCentroid, calculateHaversineDistance } from './distance';
import type { GeoCoordinates, HotspotCluster, IssueCategory } from '@/types';

export interface ClusterableReport {
  id: string;
  category: IssueCategory;
  ward: string;
  latitude: number;
  longitude: number;
  priorityScore: number;
}

/**
 * Clusters a list of reports into geographic hotspots.
 *
 * @param reports - Array of report objects with coordinates and categories
 * @returns Array of formed HotspotCluster objects
 */
export function clusterIncidents(reports: ClusterableReport[]): HotspotCluster[] {
  const clusters: HotspotCluster[] = [];
  const visitedReportIds = new Set<string>();

  for (let i = 0; i < reports.length; i++) {
    const current = reports[i];
    if (visitedReportIds.has(current.id)) {
      continue;
    }

    // Find all neighbors within spatial radius and matching category
    const clusterMembers: ClusterableReport[] = [current];
    const currentLocation: GeoCoordinates = {
      latitude: current.latitude,
      longitude: current.longitude,
    };

    for (let j = 0; j < reports.length; j++) {
      if (i === j) continue;
      const other = reports[j];
      if (visitedReportIds.has(other.id)) continue;

      if (current.category === other.category) {
        const otherLocation: GeoCoordinates = {
          latitude: other.latitude,
          longitude: other.longitude,
        };

        const distance = calculateHaversineDistance(currentLocation, otherLocation);
        if (distance <= CONFIG.CLUSTERING.RADIUS_METERS) {
          clusterMembers.push(other);
        }
      }
    }

    // Check if cluster meets the minimum density threshold
    if (clusterMembers.length >= CONFIG.CLUSTERING.MIN_REPORTS_FOR_HOTSPOT) {
      clusterMembers.forEach((m) => visitedReportIds.add(m.id));

      const points = clusterMembers.map((m) => ({
        latitude: m.latitude,
        longitude: m.longitude,
      }));

      const center = calculateCentroid(points);
      const totalSeverity = clusterMembers.reduce((sum, m) => sum + m.priorityScore, 0);
      const averageSeverity = Math.round((totalSeverity / clusterMembers.length) * 10) / 10;

      clusters.push({
        id: `HOTSPOT-${current.category}-${clusters.length + 1}`,
        ward: current.ward || 'Central Ward',
        category: current.category,
        center,
        radiusMeters: CONFIG.CLUSTERING.RADIUS_METERS,
        reportCount: clusterMembers.length,
        severityScore: averageSeverity,
        reportIds: clusterMembers.map((m) => m.id),
        actionBrief: `Active ${current.category} cluster in ${current.ward || 'Central Ward'} with ${clusterMembers.length} verified reports. Immediate crew dispatch advised.`,
      });
    }
  }

  return clusters;
}
