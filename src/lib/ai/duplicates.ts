/**
 * Duplicate Incident Detection Logic
 *
 * Why it works:
 * Civic issues (like a burst water pipe or a major pothole) often generate dozens
 * of duplicate reports from different residents within a short geographic radius.
 *
 * This module provides:
 * 1. Jaccard Token Similarity: Fast lexical n-gram token overlap on normalized strings.
 * 2. Vector Cosine Similarity: High-fidelity semantic similarity over embeddings.
 * 3. Composite Duplicate Evaluator: Checks both spatial proximity (within 200m)
 *    and content similarity (>= 0.75) to prevent false positives across different blocks.
 */

import { CONFIG } from '@/lib/config';
import { calculateHaversineDistance } from './distance';
import type { GeoCoordinates } from '@/types';

/**
 * Tokenizes and normalizes text into a unique set of lowercased alphanumeric words.
 *
 * @param text - Raw description text
 * @returns Set of normalized word tokens
 */
export function tokenizeText(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .trim();

  const tokens = normalized.split(/\s+/).filter((t) => t.length > 2);
  return new Set(tokens);
}

/**
 * Calculates the Jaccard similarity index between two texts.
 *
 * Formula: J(A, B) = |A ∩ B| / |A ∪ B|
 *
 * @param text1 - First text
 * @param text2 - Second text
 * @returns Similarity score between 0.0 and 1.0
 */
export function calculateJaccardSimilarity(text1: string, text2: string): number {
  const tokens1 = tokenizeText(text1);
  const tokens2 = tokenizeText(text2);

  if (tokens1.size === 0 && tokens2.size === 0) {
    return 1.0;
  }
  if (tokens1.size === 0 || tokens2.size === 0) {
    return 0.0;
  }

  let intersectionCount = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = tokens1.size + tokens2.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Computes Cosine Similarity between two numerical embedding vectors.
 *
 * Formula: (A · B) / (||A|| * ||B||)
 *
 * @param vecA - Array of float numbers
 * @param vecB - Array of float numbers
 * @returns Cosine similarity between -1.0 and 1.0
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    return 0.0;
  }

  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) {
    return 0.0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface CandidateReport {
  id: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  embedding?: number[] | null;
}

export interface DuplicateMatchResult {
  isDuplicate: boolean;
  matchedReportId?: string;
  similarityScore: number;
  distanceMeters: number;
  method: 'EMBEDDING_COSINE' | 'TOKEN_JACCARD';
}

/**
 * Evaluates whether a new report is a duplicate of any pre-filtered candidate report.
 *
 * Rules:
 * 1. Must share the same category.
 * 2. Geodesic distance must be <= CONFIG.DUPLICATES.RADIUS_METERS (200m).
 * 3. Text or embedding similarity must be >= CONFIG.DUPLICATES.SIMILARITY_THRESHOLD (0.75).
 *
 * @param newReport - New incoming report
 * @param candidates - Pre-filtered candidates from database (within bounding box)
 * @returns DuplicateMatchResult
 */
export function findDuplicateCandidate(
  newReport: {
    category: string;
    description: string;
    location: GeoCoordinates;
    embedding?: number[] | null;
  },
  candidates: CandidateReport[]
): DuplicateMatchResult {
  let highestSimilarity = 0.0;
  let bestCandidateId: string | undefined;
  let bestDistance = Infinity;
  let bestMethod: 'EMBEDDING_COSINE' | 'TOKEN_JACCARD' = 'TOKEN_JACCARD';

  for (const candidate of candidates) {
    // Rule 1: Different categories cannot be duplicates (e.g., Streetlight vs Pothole at the same corner)
    if (candidate.category !== newReport.category) {
      continue;
    }

    // Rule 2: Distance must be within radius
    const distance = calculateHaversineDistance(newReport.location, {
      latitude: candidate.latitude,
      longitude: candidate.longitude,
    });

    if (distance > CONFIG.DUPLICATES.RADIUS_METERS) {
      continue;
    }

    // Rule 3: Compute similarity (prefer embedding if both available, otherwise fallback to token overlap)
    let similarity = 0.0;
    let method: 'EMBEDDING_COSINE' | 'TOKEN_JACCARD' = 'TOKEN_JACCARD';

    if (
      newReport.embedding &&
      candidate.embedding &&
      newReport.embedding.length > 0 &&
      candidate.embedding.length > 0
    ) {
      similarity = calculateCosineSimilarity(newReport.embedding, candidate.embedding);
      method = 'EMBEDDING_COSINE';
    } else {
      similarity = calculateJaccardSimilarity(newReport.description, candidate.description);
      method = 'TOKEN_JACCARD';
    }

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestCandidateId = candidate.id;
      bestDistance = distance;
      bestMethod = method;
    }
  }

  const isDuplicate = highestSimilarity >= CONFIG.DUPLICATES.SIMILARITY_THRESHOLD;

  return {
    isDuplicate,
    matchedReportId: isDuplicate ? bestCandidateId : undefined,
    similarityScore: Math.round(highestSimilarity * 100) / 100,
    distanceMeters: Math.round(bestDistance * 10) / 10,
    method: bestMethod,
  };
}
