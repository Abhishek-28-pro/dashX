import { describe, it, expect } from 'vitest';
import {
  createReportSchema,
  updateReportStatusSchema,
  trackReportSchema,
} from '@/lib/validation';

describe('Validation Schemas (Zod)', () => {
  it('accepts valid citizen report input', () => {
    const validData = {
      title: 'Broken streetlight on Main St',
      description: 'The light flickers constantly and makes buzzing noises all night.',
      category: 'STREETLIGHT',
      latitude: 28.6139,
      longitude: 77.209,
    };

    const result = createReportSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects coordinates out of bounds', () => {
    const invalidLat = {
      title: 'Broken streetlight on Main St',
      description: 'The light flickers constantly and makes buzzing noises all night.',
      category: 'STREETLIGHT',
      latitude: 105.0, // Invalid > 90
      longitude: 77.209,
    };
    expect(createReportSchema.safeParse(invalidLat).success).toBe(false);

    const invalidLng = {
      title: 'Broken streetlight on Main St',
      description: 'The light flickers constantly and makes buzzing noises all night.',
      category: 'STREETLIGHT',
      latitude: 28.6139,
      longitude: -195.0, // Invalid < -180
    };
    expect(createReportSchema.safeParse(invalidLng).success).toBe(false);
  });

  it('rejects unknown fields strictly', () => {
    const dataWithUnknown = {
      title: 'Valid title here',
      description: 'Valid description text describing the civic issue.',
      category: 'POTHOLE',
      latitude: 28.61,
      longitude: 77.2,
      isAdminOverride: true, // Unknown field
    };

    const result = createReportSchema.safeParse(dataWithUnknown);
    expect(result.success).toBe(false);
  });

  it('detects honeypot bot submissions', () => {
    const botData = {
      title: 'Spam report title',
      description: 'Spam description text here.',
      category: 'GARBAGE',
      latitude: 28.61,
      longitude: 77.2,
      website: 'http://spam-bot.xyz', // Honeypot filled by bot
    };

    const result = createReportSchema.safeParse(botData);
    expect(result.success).toBe(false);
  });

  it('enforces note requirement when transitioning status to RESOLVED', () => {
    // Missing note -> Rejected
    const missingNote = {
      status: 'RESOLVED',
    };
    expect(updateReportStatusSchema.safeParse(missingNote).success).toBe(false);

    // With note -> Accepted
    const withNote = {
      status: 'RESOLVED',
      note: 'Replaced damaged asphalt with cold-mix bitumen. Road clear.',
    };
    expect(updateReportStatusSchema.safeParse(withNote).success).toBe(true);
  });

  it('validates tracking ID format correctly', () => {
    expect(trackReportSchema.safeParse({ trackingId: 'REP-7K9X2M4B' }).success).toBe(true);
    expect(trackReportSchema.safeParse({ trackingId: 'DROP TABLE;' }).success).toBe(false);
  });
});
