/**
 * Civic Dispatch Action Brief Synthesizer
 *
 * Why it works:
 * Municipal department heads and ward supervisors don't have time to read 50 individual
 * citizen reports. This pure synthesizer generates actionable, standardized operational
 * briefs for field response teams.
 */

import type { HotspotCluster } from '@/types';

/**
 * Synthesizes a structured tactical brief for field dispatch teams.
 *
 * @param cluster - The hotspot cluster object
 * @returns Multi-sentence operational dispatch brief
 */
export function generateActionBrief(cluster: HotspotCluster): string {
  const urgencyLabel =
    cluster.severityScore >= 80 ? 'CRITICAL' : cluster.severityScore >= 60 ? 'HIGH' : 'STANDARD';

  return [
    `TACTICAL DISPATCH [${urgencyLabel}]: Hotspot cluster identified in ${cluster.ward} centered at (${cluster.center.latitude.toFixed(4)}, ${cluster.center.longitude.toFixed(4)}).`,
    `Aggregated Volume: ${cluster.reportCount} reports with composite severity index of ${cluster.severityScore.toFixed(1)}/100.`,
    `Recommended Action: Deploy dedicated ${cluster.category.toLowerCase().replace('_', ' ')} repair crew within ${urgencyLabel === 'CRITICAL' ? '4 hours' : '24 hours'}. Barricade active hazard zone if required.`,
  ].join(' ');
}
