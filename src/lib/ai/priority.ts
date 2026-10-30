/**
 * Pure Deterministic Priority Calculation Engine
 *
 * Why it works:
 * Rather than delegating critical municipal resource allocation to an unpredictable black-box LLM,
 * this engine uses a transparent, auditable 100-point multi-criteria formula.
 *
 * Factors:
 * 1. Base Severity (30 pts): Inherent danger of the issue category (e.g., Live Wire / Traffic Hazard > Garbage).
 * 2. Public Impact (25 pts): Proximity to schools, hospitals, transit hubs, and public density.
 * 3. Recidivism & Duplicates (20 pts): Number of citizens independently reporting the issue.
 * 4. Time Decay Escalation (15 pts): Unresolved age (scales smoothly up to 72 hours).
 * 5. Capped LLM Urgency (10 pts): Deep semantic analysis from the LLM (clamped to max 10 points to prevent prompt injection).
 */

import { CONFIG } from '@/lib/config';
import type { IssueCategory, PriorityResult, UrgencyLevel } from '@/types';

export interface PriorityCalculationParams {
  category: IssueCategory;
  duplicateCount: number; // Number of linked duplicates or recurring complaints
  ageInHours: number; // Time elapsed since submission
  isNearCriticalInfrastructure?: boolean; // School, hospital, metro station, high-density zone
  llmUrgencyFactor?: number; // Optional LLM sentiment factor [0 - 10]
}

/**
 * Calculates a deterministic priority score between 0 and 100 along with plain-English rationales.
 *
 * @param params - Configuration parameters for the calculation
 * @returns PriorityResult { score, urgencyLevel, rationale }
 */
export function calculatePriorityScore(params: PriorityCalculationParams): PriorityResult {
  const {
    category,
    duplicateCount,
    ageInHours,
    isNearCriticalInfrastructure = false,
    llmUrgencyFactor = 0,
  } = params;

  const rationale: string[] = [];

  // 1. Base Severity (0 to 30 pts)
  const baseCategoryMultiplier = CONFIG.PRIORITY.CATEGORY_BASE_SCORES[category] ?? 0.5;
  const baseSeverityScore = baseCategoryMultiplier * CONFIG.PRIORITY.WEIGHT_BASE_SEVERITY;
  rationale.push(
    `Base severity for category ${category}: ${baseSeverityScore.toFixed(1)} / ${CONFIG.PRIORITY.WEIGHT_BASE_SEVERITY} pts`
  );

  // 2. Public Impact (0 to 25 pts)
  // If located near schools, hospitals, or major intersections, awards full public impact weight
  const publicImpactScore = isNearCriticalInfrastructure
    ? CONFIG.PRIORITY.WEIGHT_PUBLIC_IMPACT
    : 5.0;
  if (isNearCriticalInfrastructure) {
    rationale.push(
      `High public impact area (school/hospital/transit proximity): +${publicImpactScore.toFixed(1)} pts`
    );
  } else {
    rationale.push(
      `Standard residential/commercial area impact: +${publicImpactScore.toFixed(1)} pts`
    );
  }

  // 3. Recidivism & Duplicate Clustering (0 to 20 pts)
  // Logarithmic scaling: Diminishing returns so 1 duplicate adds significantly, but 100 duplicates don't explode
  // Formula: min(20, log2(duplicates + 1) * 5)
  const safeDups = Math.max(0, duplicateCount);
  const duplicateScore = Math.min(
    CONFIG.PRIORITY.WEIGHT_RECIDIVISM_CLUSTER,
    Math.log2(safeDups + 1) * 5.0
  );
  if (safeDups > 0) {
    rationale.push(
      `Citizen recurrence (${safeDups} corroborating duplicate reports): +${duplicateScore.toFixed(1)} / ${CONFIG.PRIORITY.WEIGHT_RECIDIVISM_CLUSTER} pts`
    );
  }

  // 4. Time Decay Escalation (0 to 15 pts)
  // Linear scaling from 0 to 72 hours
  const safeAge = Math.max(0, ageInHours);
  const timeDecayFraction = Math.min(1.0, safeAge / CONFIG.PRIORITY.MAX_TIME_DECAY_HOURS);
  const timeDecayScore = timeDecayFraction * CONFIG.PRIORITY.WEIGHT_TIME_DECAY;
  if (safeAge > 0) {
    rationale.push(
      `Aging escalation (${safeAge.toFixed(1)} hours unresolved): +${timeDecayScore.toFixed(1)} / ${CONFIG.PRIORITY.WEIGHT_TIME_DECAY} pts`
    );
  }

  // 5. Capped LLM Urgency Factor (0 to 10 pts)
  // DEFENSE AGAINST PROMPT INJECTION: Clamp to [0, 10]
  const clampedLlmScore = Math.min(
    CONFIG.PRIORITY.WEIGHT_LLM_URGENCY,
    Math.max(0, Number(llmUrgencyFactor) || 0)
  );
  if (clampedLlmScore > 0) {
    rationale.push(
      `AI context analysis urgency bonus: +${clampedLlmScore.toFixed(1)} / ${CONFIG.PRIORITY.WEIGHT_LLM_URGENCY} pts`
    );
  }

  // Final Composite Score (clamped to 0 - 100)
  const rawTotal =
    baseSeverityScore + publicImpactScore + duplicateScore + timeDecayScore + clampedLlmScore;
  const score = Math.min(100, Math.max(0, Math.round(rawTotal * 10) / 10));

  // Determine Urgency Level based on configured thresholds
  let urgencyLevel: UrgencyLevel = 'LOW';
  if (score >= CONFIG.PRIORITY.THRESHOLDS.CRITICAL) {
    urgencyLevel = 'CRITICAL';
  } else if (score >= CONFIG.PRIORITY.THRESHOLDS.HIGH) {
    urgencyLevel = 'HIGH';
  } else if (score >= CONFIG.PRIORITY.THRESHOLDS.MEDIUM) {
    urgencyLevel = 'MEDIUM';
  }

  return {
    score,
    urgencyLevel,
    rationale,
  };
}
