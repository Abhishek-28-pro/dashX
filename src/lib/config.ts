/**
 * Central Configuration & Tunable Thresholds
 * Single source of truth for all mathematical parameters, heuristics, and security limits.
 * No magic numbers elsewhere.
 */

export const CONFIG = {
  // Duplication Detection Constants
  DUPLICATES: {
    SIMILARITY_THRESHOLD: 0.75, // 75% token or cosine similarity
    RADIUS_METERS: 200, // Distance radius within which duplicates are searched (200m)
    LOOKBACK_DAYS: 30, // Window of days to search active duplicates
  },

  // Priority Calculation Weights (Max 100 points)
  PRIORITY: {
    WEIGHT_BASE_SEVERITY: 30, // Category inherent danger
    WEIGHT_PUBLIC_IMPACT: 25, // Proximity to sensitive locations / density
    WEIGHT_RECIDIVISM_CLUSTER: 20, // Number of duplicates/linked complaints
    WEIGHT_TIME_DECAY: 15, // Age of unresolved issue (up to 72h max escalation)
    WEIGHT_LLM_URGENCY: 10, // Clamped AI sentiment/urgency score (max 10 points)
    MAX_TIME_DECAY_HOURS: 72,
    THRESHOLDS: {
      CRITICAL: 80,
      HIGH: 60,
      MEDIUM: 40,
      LOW: 0,
    },
    CATEGORY_BASE_SCORES: {
      TRAFFIC_HAZARD: 1.0, // High immediate physical danger
      DRAINAGE: 0.85, // Flooding / structural hazard
      POTHOLE: 0.8, // Road safety & vehicle damage
      WATER_LEAKAGE: 0.7, // Utility loss / ground erosion
      GARBAGE: 0.6, // Sanitation & health hazard
      STREETLIGHT: 0.5, // Night vision & security
      OTHER: 0.4,
    } as Record<string, number>,
  },

  // Hotspot / Clustering Constants
  CLUSTERING: {
    RADIUS_METERS: 350, // 350 meters neighborhood grouping radius
    MIN_REPORTS_FOR_HOTSPOT: 3, // Minimum 3 reports to constitute an active hotspot
    CACHE_TTL_SECONDS: 60, // Cache duration for pre-computed aggregates
  },

  // Upload Hardening Constraints
  UPLOAD: {
    MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
    MAGIC_BYTES: {
      JPEG: [0xff, 0xd8, 0xff],
      PNG: [0x89, 0x50, 0x4e, 0x47],
      WEBP_RIFF: [0x52, 0x49, 0x46, 0x46], // 'RIFF'
      WEBP_HEADER: [0x57, 0x45, 0x42, 0x50], // 'WEBP' at offset 8
    },
    STORAGE_DIR: 'public/uploads',
  },

  // Security, Limits & Timeouts
  SECURITY: {
    RATE_LIMIT_SUBMIT_WINDOW_MS: 60 * 1000, // 1 minute
    RATE_LIMIT_SUBMIT_MAX_REQUESTS: 10,
    RATE_LIMIT_TRACK_WINDOW_MS: 60 * 1000,
    RATE_LIMIT_TRACK_MAX_REQUESTS: 30,
    TRACKING_ID_PREFIX: 'REP-',
    TRACKING_ID_RANDOM_LENGTH: 8,
    MAX_TEXT_LENGTH: 2000,
    MIN_TEXT_LENGTH: 10,
    LLM_TIMEOUT_MS: 8000, // 8-second timeout for LLM enrichment
    COOKIE_NAME: 'pw_mock_auth_role',
  },

  // Pagination Standards
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
} as const;
