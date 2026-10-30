/**
 * Heuristic & Rule-Based Fallback Categorizer and Summarizer
 *
 * Why it works:
 * LLMs can time out, hit quota limits, or fail due to network disruptions.
 * In a mission-critical civic triage application, citizen submissions must NEVER
 * be dropped or blocked because of an AI failure.
 *
 * This pure fallback engine uses regex patterns, lexical keyword matching,
 * and deterministic truncation to guarantee 100% service availability.
 */

import type { AIEnrichmentOutput } from '@/lib/validation';
import type { IssueCategory, MunicipalDepartment } from '@/types';

interface CategoryKeywordRule {
  category: IssueCategory;
  department: MunicipalDepartment;
  keywords: RegExp;
  baseUrgency: number;
}

const CATEGORY_RULES: CategoryKeywordRule[] = [
  {
    category: 'POTHOLE',
    department: 'ROADS_AND_BRIDGES',
    keywords: /\b(pothole|crater|asphalt|tarmac|road hole|bump|broken road|uneven road)\b/i,
    baseUrgency: 6.0,
  },
  {
    category: 'GARBAGE',
    department: 'SOLID_WASTE_MANAGEMENT',
    keywords: /\b(garbage|trash|waste|dump|litter|debris|rubbish|dustbin|overflow|smell|stench)\b/i,
    baseUrgency: 5.0,
  },
  {
    category: 'STREETLIGHT',
    department: 'ELECTRICAL_AND_LIGHTING',
    keywords: /\b(streetlight|street light|light|lamp|dark|pole|wire|bulb|blackout)\b/i,
    baseUrgency: 4.5,
  },
  {
    category: 'WATER_LEAKAGE',
    department: 'WATER_SUPPLY_AND_SEWERAGE',
    keywords: /\b(leak|leaking|burst|pipe|pipeline|water supply|drinking water|tap|spill)\b/i,
    baseUrgency: 6.5,
  },
  {
    category: 'DRAINAGE',
    department: 'WATER_SUPPLY_AND_SEWERAGE',
    keywords:
      /\b(drain|drainage|sewer|manhole|clog|gutter|overflowing drain|flood|waterlogging)\b/i,
    baseUrgency: 7.0,
  },
  {
    category: 'TRAFFIC_HAZARD',
    department: 'TRAFFIC_POLICE',
    keywords: /\b(traffic|signal|accident|block|gridlock|fallen tree|barrier|hazard|blind spot)\b/i,
    baseUrgency: 8.0,
  },
];

/**
 * Deterministically categorizes text and extracts key metadata without LLM.
 *
 * @param title - Report title
 * @param description - Report description
 * @param selectedCategory - Category selected by user on the form
 * @returns AIEnrichmentOutput
 */
export function heuristicFallbackCategorize(
  title: string,
  description: string,
  selectedCategory?: IssueCategory
): AIEnrichmentOutput {
  const combined = `${title} ${description}`.toLowerCase();

  let matchedCategory: IssueCategory = selectedCategory ?? 'OTHER';
  let matchedDepartment: MunicipalDepartment = 'GENERAL_MAINTENANCE';
  let urgency = 4.0;

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.test(combined)) {
      matchedCategory = rule.category;
      matchedDepartment = rule.department;
      urgency = rule.baseUrgency;
      break;
    }
  }

  // If user explicitly picked a valid category and regex didn't override with high confidence, respect user choice
  if (selectedCategory && selectedCategory !== 'OTHER') {
    matchedCategory = selectedCategory;
    const matchingRule = CATEGORY_RULES.find((r) => r.category === selectedCategory);
    if (matchingRule) {
      matchedDepartment = matchingRule.department;
      urgency = matchingRule.baseUrgency;
    }
  }

  // Generate a concise 1-sentence summary
  const cleanDesc = description.replace(/\s+/g, ' ').trim();
  const summary =
    cleanDesc.length > 140
      ? `${cleanDesc.substring(0, 137)}...`
      : cleanDesc || `${matchedCategory} reported.`;

  return {
    category: matchedCategory,
    subCategory: 'General Inquiry',
    summary,
    urgencyFactor: urgency,
    suggestedAltText: `Photo showing ${matchedCategory.toLowerCase().replace('_', ' ')} incident`,
    department: matchedDepartment,
    rationaleSnippet: `Rule-based triage assigned to ${matchedDepartment} based on keyword detection`,
  };
}
