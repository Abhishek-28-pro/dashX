import { describe, it, expect } from 'vitest';
import { heuristicFallbackCategorize } from '@/lib/ai/fallback';

describe('Heuristic Fallback Categorizer (Pure Logic)', () => {
  it('correctly categorizes pothole keywords and assigns Roads department', () => {
    const result = heuristicFallbackCategorize(
      'Dangerous road hole',
      'A deep crater pothole damaged two car tires on the highway.'
    );

    expect(result.category).toBe('POTHOLE');
    expect(result.department).toBe('ROADS_AND_BRIDGES');
    expect(result.urgencyFactor).toBeGreaterThanOrEqual(6.0);
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it('correctly categorizes water leakage keywords and assigns Water Supply department', () => {
    const result = heuristicFallbackCategorize(
      'Clean water leaking from pipeline',
      'The pipeline burst open and drinking water is spilling down the street.'
    );

    expect(result.category).toBe('WATER_LEAKAGE');
    expect(result.department).toBe('WATER_SUPPLY_AND_SEWERAGE');
    expect(result.urgencyFactor).toBeGreaterThanOrEqual(6.0);
  });

  it('respects user category when keyword match is generic', () => {
    const result = heuristicFallbackCategorize(
      'Notice board broken',
      'The municipal notice board was damaged by wind.',
      'OTHER'
    );

    expect(result.category).toBe('OTHER');
    expect(result.department).toBe('GENERAL_MAINTENANCE');
  });
});
