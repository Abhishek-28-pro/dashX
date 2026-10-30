/**
 * Unified Zod Validation Schemas
 * Single source of truth for UI forms and API endpoints.
 * Enforces strict typing, length restrictions, range validation, and unknown field rejection.
 */

import { z } from 'zod';
import { IssueCategories, IssueStatuses, MunicipalDepartments } from '@/types';
import { CONFIG } from '@/lib/config';

// Safe text regex that disallows null bytes and dangerous control characters
const safeTextPattern = /^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F]*$/;

/**
 * Report Creation Schema (Citizen submission)
 */
export const createReportSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(120, 'Title cannot exceed 120 characters')
      .regex(safeTextPattern, 'Invalid characters in title')
      .trim(),
    description: z
      .string()
      .min(
        CONFIG.SECURITY.MIN_TEXT_LENGTH,
        `Description must be at least ${CONFIG.SECURITY.MIN_TEXT_LENGTH} characters`
      )
      .max(
        CONFIG.SECURITY.MAX_TEXT_LENGTH,
        `Description cannot exceed ${CONFIG.SECURITY.MAX_TEXT_LENGTH} characters`
      )
      .regex(safeTextPattern, 'Invalid characters in description')
      .trim(),
    category: z.enum(IssueCategories, {
      errorMap: () => ({ message: 'Please select a valid category' }),
    }),
    subCategory: z.string().max(80).optional(),
    latitude: z
      .number({ required_error: 'Latitude is required' })
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90'),
    longitude: z
      .number({ required_error: 'Longitude is required' })
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180'),
    address: z.string().max(300).optional(),
    ward: z.string().max(60).optional(),
    imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
    imageAltText: z.string().max(250).optional(),
    reporterName: z.string().max(100).optional(),
    reporterPhone: z.string().max(20).optional(),
    // Bot honeypot field: Must be empty or undefined. Real users won't see or fill it.
    website: z.string().max(0, 'Bot detected').optional().or(z.literal('')),
  })
  .strict();

export type CreateReportInput = z.infer<typeof createReportSchema>;

/**
 * Status Update & Assignment Schema (Admin only)
 */
export const updateReportStatusSchema = z
  .object({
    status: z.enum(IssueStatuses),
    assignedDept: z.enum(MunicipalDepartments).optional(),
    assignedTeam: z.string().max(100).optional(),
    note: z.string().max(1000).optional(),
  })
  .strict()
  .refine(
    (data) => {
      // Rule: Jumps to RESOLVED, CLOSED, or REJECTED require an explanatory note
      if (['RESOLVED', 'CLOSED', 'REJECTED'].includes(data.status)) {
        return !!data.note && data.note.trim().length >= 5;
      }
      return true;
    },
    {
      message:
        'A note of at least 5 characters is required when resolving, closing, or rejecting a report',
      path: ['note'],
    }
  );

export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;

/**
 * Tracking ID Lookup Schema
 */
export const trackReportSchema = z
  .object({
    trackingId: z
      .string()
      .min(CONFIG.SECURITY.TRACKING_ID_PREFIX.length + 4, 'Invalid tracking ID format')
      .max(30, 'Tracking ID is too long')
      .regex(/^[A-Z0-9_-]+$/i, 'Tracking ID contains invalid characters')
      .trim(),
  })
  .strict();

export type TrackReportInput = z.infer<typeof trackReportSchema>;

/**
 * Report Query / Pagination Schema
 */
export const queryReportsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(CONFIG.PAGINATION.MAX_PAGE_SIZE)
      .default(CONFIG.PAGINATION.DEFAULT_PAGE_SIZE),
    status: z.enum(IssueStatuses).optional(),
    category: z.enum(IssueCategories).optional(),
    ward: z.string().optional(),
    search: z.string().max(100).optional(),
    // Optional bounding box query for map viewport filtering
    minLat: z.coerce.number().min(-90).max(90).optional(),
    maxLat: z.coerce.number().min(-90).max(90).optional(),
    minLng: z.coerce.number().min(-180).max(180).optional(),
    maxLng: z.coerce.number().min(-180).max(180).optional(),
  })
  .strict();

export type QueryReportsInput = z.infer<typeof queryReportsSchema>;

/**
 * AI Enrichment Output Schema (for strict LLM response parsing)
 */
export const aiEnrichmentSchema = z
  .object({
    category: z.enum(IssueCategories),
    subCategory: z.string().max(80).default('General'),
    summary: z.string().max(300),
    urgencyFactor: z.number().min(0).max(10), // Clamped 0-10
    suggestedAltText: z.string().max(200).optional(),
    department: z.enum(MunicipalDepartments),
    rationaleSnippet: z.string().max(200),
  })
  .strict();

export type AIEnrichmentOutput = z.infer<typeof aiEnrichmentSchema>;
