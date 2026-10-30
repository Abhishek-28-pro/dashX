import { describe, it, expect } from 'vitest';
import { verifyImageMagicBytes, processAndSaveImage } from '@/lib/security/image';
import sharp from 'sharp';

describe('Image Upload Hardening (Security & Integrity)', () => {
  it('identifies valid PNG magic bytes', async () => {
    // Generate a minimal valid 1x1 PNG using sharp
    const pngBuffer = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    const format = verifyImageMagicBytes(pngBuffer);
    expect(format).toBe('png');
  });

  it('identifies valid JPEG magic bytes', async () => {
    const jpegBuffer = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const format = verifyImageMagicBytes(jpegBuffer);
    expect(format).toBe('jpeg');
  });

  it('rejects fake images that contain HTML or script payloads', () => {
    const maliciousPayload = Buffer.from('<script>alert("XSS")</script>', 'utf-8');
    const format = verifyImageMagicBytes(maliciousPayload);
    expect(format).toBeNull();
  });

  it('rejects oversized files exceeding 5MB limit', async () => {
    // Create oversized mock buffer of 6MB
    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024);
    await expect(processAndSaveImage(oversizedBuffer)).rejects.toThrow(
      /File size exceeds the 5 MB limit/
    );
  });

  it('processes genuine image and outputs sanitized WebP', async () => {
    const initialBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 50, g: 100, b: 150 },
      },
    })
      .png()
      .toBuffer();

    const result = await processAndSaveImage(initialBuffer, 'test-pothole.png');
    expect(result.url).toMatch(/^\/uploads\/[a-f0-9]{32}\.webp$/);
    expect(result.format).toBe('webp');
  });
});
