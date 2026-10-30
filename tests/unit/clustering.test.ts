import { describe, it, expect } from 'vitest';
import { clusterIncidents, type ClusterableReport } from '@/lib/ai/clustering';

describe('Hotspot Clustering Engine (Pure Logic)', () => {
  it('groups 3 nearby reports of same category into a hotspot cluster', () => {
    const reports: ClusterableReport[] = [
      {
        id: 'R1',
        category: 'GARBAGE',
        ward: 'West Ward',
        latitude: 28.651,
        longitude: 77.19,
        priorityScore: 70,
      },
      {
        id: 'R2',
        category: 'GARBAGE',
        ward: 'West Ward',
        latitude: 28.6512, // ~30m away
        longitude: 77.1903,
        priorityScore: 80,
      },
      {
        id: 'R3',
        category: 'GARBAGE',
        ward: 'West Ward',
        latitude: 28.6515, // ~60m away
        longitude: 77.1906,
        priorityScore: 90,
      },
    ];

    const clusters = clusterIncidents(reports);
    expect(clusters.length).toBe(1);
    expect(clusters[0].reportCount).toBe(3);
    expect(clusters[0].severityScore).toBe(80); // (70+80+90)/3 = 80
    expect(clusters[0].category).toBe('GARBAGE');
    expect(clusters[0].actionBrief).toContain('Active GARBAGE cluster');
  });

  it('does not create cluster when fewer than 3 incidents are within radius', () => {
    const sparseReports: ClusterableReport[] = [
      {
        id: 'S1',
        category: 'POTHOLE',
        ward: 'Central Ward',
        latitude: 28.63,
        longitude: 77.21,
        priorityScore: 50,
      },
      {
        id: 'S2',
        category: 'POTHOLE',
        ward: 'Central Ward',
        latitude: 28.631,
        longitude: 77.211,
        priorityScore: 60,
      },
    ];

    const clusters = clusterIncidents(sparseReports);
    expect(clusters.length).toBe(0);
  });
});
