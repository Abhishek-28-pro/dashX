import { describe, it, expect } from 'vitest';
import { calculatePriorityScore } from '@/lib/ai/priority';
import { CONFIG } from '@/lib/config';

describe('Priority Calculation Engine (Pure Logic)', () => {
  it('calculates baseline score for standard pothole without decay or duplicates', () => {
    const result = calculatePriorityScore({
      category: 'POTHOLE',
      duplicateCount: 0,
      ageInHours: 0,
      isNearCriticalInfrastructure: false,
    });

    // Pothole base multiplier is 0.8 * 30 = 24. Standard area = 5. Total = 29.
    expect(result.score).toBe(29);
    expect(result.urgencyLevel).toBe('LOW'); // < 40 is LOW
    expect(result.rationale.length).toBeGreaterThan(0);
  });

  it('correctly transitions between urgency boundaries', () => {
    // Medium threshold >= 40
    const mediumResult = calculatePriorityScore({
      category: 'TRAFFIC_HAZARD', // base: 1.0 * 30 = 30
      duplicateCount: 0,
      ageInHours: 24, // 24/72 * 15 = 5
      isNearCriticalInfrastructure: true, // +25 = 60
    });
    expect(mediumResult.score).toBeGreaterThanOrEqual(CONFIG.PRIORITY.THRESHOLDS.HIGH);
    expect(mediumResult.urgencyLevel).toBe('HIGH');

    // Critical threshold >= 80
    const criticalResult = calculatePriorityScore({
      category: 'TRAFFIC_HAZARD', // 30
      duplicateCount: 5, // log2(6)*5 ~ 12.9
      ageInHours: 72, // 15
      isNearCriticalInfrastructure: true, // 25
      llmUrgencyFactor: 10, // 10
    });
    // 30 + 25 + 12.9 + 15 + 10 = 92.9 -> 93
    expect(criticalResult.score).toBeGreaterThanOrEqual(CONFIG.PRIORITY.THRESHOLDS.CRITICAL);
    expect(criticalResult.urgencyLevel).toBe('CRITICAL');
  });

  it('strictly clamps LLM urgency factor to maximum 10 points (Prompt Injection Defense)', () => {
    const normalResult = calculatePriorityScore({
      category: 'POTHOLE',
      duplicateCount: 0,
      ageInHours: 0,
      llmUrgencyFactor: 10,
    });

    const maliciousOverweightResult = calculatePriorityScore({
      category: 'POTHOLE',
      duplicateCount: 0,
      ageInHours: 0,
      llmUrgencyFactor: 9999, // Attacker injected high factor
    });

    // Both should yield the exact same score because LLM factor is hard-capped at 10
    expect(maliciousOverweightResult.score).toBe(normalResult.score);
  });

  it('never produces scores below 0 or above 100', () => {
    const minResult = calculatePriorityScore({
      category: 'OTHER',
      duplicateCount: -10,
      ageInHours: -5,
      llmUrgencyFactor: -100,
    });
    expect(minResult.score).toBeGreaterThanOrEqual(0);

    const maxResult = calculatePriorityScore({
      category: 'TRAFFIC_HAZARD',
      duplicateCount: 1000,
      ageInHours: 500,
      isNearCriticalInfrastructure: true,
      llmUrgencyFactor: 50,
    });
    expect(maxResult.score).toBeLessThanOrEqual(100);
  });
});
