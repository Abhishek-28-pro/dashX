import { describe, it, expect } from 'vitest';
import {
  calculateJaccardSimilarity,
  calculateCosineSimilarity,
  findDuplicateCandidate,
} from '@/lib/ai/duplicates';

describe('Duplicate Incident Detection (Pure Logic)', () => {
  it('computes high Jaccard similarity for identical or paraphrased descriptions', () => {
    const text1 = 'Large deep pothole outside metro gate 3 road crater';
    const text2 = 'Deep crater pothole outside metro gate 3 road';

    const similarity = calculateJaccardSimilarity(text1, text2);
    expect(similarity).toBeGreaterThanOrEqual(0.75);
  });

  it('computes low Jaccard similarity for unrelated text', () => {
    const text1 = 'Deep pothole damaging vehicles';
    const text2 = 'Street light pole blinks at night';

    const similarity = calculateJaccardSimilarity(text1, text2);
    expect(similarity).toBeLessThan(0.2);
  });

  it('computes cosine similarity accurately for orthogonal and identical vectors', () => {
    const v1 = [1, 0, 0];
    const v2 = [1, 0, 0];
    const v3 = [0, 1, 0];

    expect(calculateCosineSimilarity(v1, v2)).toBeCloseTo(1.0);
    expect(calculateCosineSimilarity(v1, v3)).toBeCloseTo(0.0);
  });

  it('identifies true duplicate within 200m with matching category', () => {
    const newReport = {
      category: 'POTHOLE',
      description: 'Dangerous crater road hole near gate 3 metro station swerving cars',
      location: { latitude: 28.633, longitude: 77.2196 },
    };

    const candidates = [
      {
        id: 'EXISTING-1',
        category: 'POTHOLE',
        description: 'Dangerous crater road hole near gate 3 metro station swerving vehicles',
        latitude: 28.6328, // ~25m away
        longitude: 77.2195,
      },
    ];

    const result = findDuplicateCandidate(newReport, candidates);
    expect(result.isDuplicate).toBe(true);
    expect(result.matchedReportId).toBe('EXISTING-1');
    expect(result.similarityScore).toBeGreaterThanOrEqual(0.75);
  });

  it('rejects candidate if distance exceeds 200m even with identical text', () => {
    const newReport = {
      category: 'POTHOLE',
      description: 'Exact same crater pothole description on road',
      location: { latitude: 28.633, longitude: 77.2196 },
    };

    const distantCandidate = [
      {
        id: 'EXISTING-DISTANT',
        category: 'POTHOLE',
        description: 'Exact same crater pothole description on road',
        latitude: 28.65, // ~2 km away
        longitude: 77.2196,
      },
    ];

    const result = findDuplicateCandidate(newReport, distantCandidate);
    expect(result.isDuplicate).toBe(false);
  });

  it('rejects candidate if category is different even at the exact same location', () => {
    const newReport = {
      category: 'POTHOLE',
      description: 'Dark corner at intersection near broken lamp pole',
      location: { latitude: 28.633, longitude: 77.2196 },
    };

    const differentCategoryCandidate = [
      {
        id: 'EXISTING-LIGHT',
        category: 'STREETLIGHT', // Different category
        description: 'Dark corner at intersection near broken lamp pole',
        latitude: 28.633,
        longitude: 77.2196,
      },
    ];

    const result = findDuplicateCandidate(newReport, differentCategoryCandidate);
    expect(result.isDuplicate).toBe(false);
  });
});
