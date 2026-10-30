/**
 * Core Domain Types & Enums for PromptWars x Astra Civic Issue Triage Platform
 */

export const IssueCategories = [
  'POTHOLE',
  'GARBAGE',
  'STREETLIGHT',
  'WATER_LEAKAGE',
  'TRAFFIC_HAZARD',
  'DRAINAGE',
  'OTHER',
] as const;

export type IssueCategory = (typeof IssueCategories)[number];

export const IssueStatuses = [
  'SUBMITTED',
  'TRIAGED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
] as const;

export type IssueStatus = (typeof IssueStatuses)[number];

export const UrgencyLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type UrgencyLevel = (typeof UrgencyLevels)[number];

export const MunicipalDepartments = [
  'ROADS_AND_BRIDGES',
  'SOLID_WASTE_MANAGEMENT',
  'ELECTRICAL_AND_LIGHTING',
  'WATER_SUPPLY_AND_SEWERAGE',
  'TRAFFIC_POLICE',
  'GENERAL_MAINTENANCE',
] as const;

export type MunicipalDepartment = (typeof MunicipalDepartments)[number];

export type UserRole = 'CITIZEN' | 'ADMIN';

/**
 * Standard API error structure across all endpoints
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Public Track Report Projection (PII stripped)
 */
export interface PublicTrackReport {
  trackingId: string;
  title: string;
  category: IssueCategory;
  status: IssueStatus;
  urgencyLevel: UrgencyLevel;
  approxLocation: {
    latitude: number; // Rounded to 2 decimal places for privacy
    longitude: number;
    ward?: string | null;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  publicNotes: Array<{
    status: IssueStatus;
    changedAt: string;
    note?: string | null;
  }>;
}

/**
 * Coordinates interface
 */
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Bounding Box interface
 */
export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Hotspot Cluster structure
 */
export interface HotspotCluster {
  id: string;
  ward: string;
  category: IssueCategory;
  center: GeoCoordinates;
  radiusMeters: number;
  reportCount: number;
  severityScore: number;
  reportIds: string[];
  actionBrief: string;
}

/**
 * Priority Calculation Result
 */
export interface PriorityResult {
  score: number; // 0 - 100
  urgencyLevel: UrgencyLevel;
  rationale: string[];
}
