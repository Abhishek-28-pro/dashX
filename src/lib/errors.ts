/**
 * Standardized Application & API Error Architecture
 * Consistent error format: { error: { code, message, details? } }
 */

import { NextResponse } from 'next/server';
import type { ApiErrorResponse } from '@/types';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'IMAGE_PROCESSING_ERROR'
  | 'AI_TIMEOUT'
  | 'AI_SERVICE_ERROR'
  | 'DUPLICATE_REPORT'
  | 'INVALID_STATUS_TRANSITION'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: ErrorCode = 'INTERNAL_SERVER_ERROR',
    statusCode = 500,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Creates a standard JSON response for API route errors.
 */
export function createErrorResponse(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle unexpected generic errors without leaking sensitive stack traces
  const fallbackMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: fallbackMessage,
      },
    },
    { status: 500 }
  );
}

/**
 * Creates a standard success response wrapper.
 */
export function createSuccessResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}
