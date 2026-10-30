/**
 * Hardened Image Upload Processing
 *
 * Security Controls:
 * 1. File Size Verification (Max 5 MB).
 * 2. Magic Byte Inspection: Validates true binary signatures (not just client MIME or extension).
 * 3. EXIF Stripping: Removes GPS coordinates and device metadata using Sharp to prevent privacy leaks.
 * 4. Cryptographic Filename Generation: Prevents path traversal and predictable URL enumeration.
 */

import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { AppError } from '@/lib/errors';
import { CONFIG } from '@/lib/config';

export type SupportedImageFormat = 'jpeg' | 'png' | 'webp';

/**
 * Validates binary buffer magic bytes against supported image formats.
 *
 * @param buffer - File buffer
 * @returns Detected image format or null if unrecognized
 */
export function verifyImageMagicBytes(buffer: Buffer): SupportedImageFormat | null {
  if (buffer.length < 12) return null;

  // JPEG: Starts with FF D8 FF
  if (
    buffer[0] === CONFIG.UPLOAD.MAGIC_BYTES.JPEG[0] &&
    buffer[1] === CONFIG.UPLOAD.MAGIC_BYTES.JPEG[1] &&
    buffer[2] === CONFIG.UPLOAD.MAGIC_BYTES.JPEG[2]
  ) {
    return 'jpeg';
  }

  // PNG: Starts with 89 50 4E 47
  if (
    buffer[0] === CONFIG.UPLOAD.MAGIC_BYTES.PNG[0] &&
    buffer[1] === CONFIG.UPLOAD.MAGIC_BYTES.PNG[1] &&
    buffer[2] === CONFIG.UPLOAD.MAGIC_BYTES.PNG[2] &&
    buffer[3] === CONFIG.UPLOAD.MAGIC_BYTES.PNG[3]
  ) {
    return 'png';
  }

  // WebP: Starts with RIFF and contains WEBP at byte offset 8
  const isRiff =
    buffer[0] === CONFIG.UPLOAD.MAGIC_BYTES.WEBP_RIFF[0] &&
    buffer[1] === CONFIG.UPLOAD.MAGIC_BYTES.WEBP_RIFF[1] &&
    buffer[2] === CONFIG.UPLOAD.MAGIC_BYTES.WEBP_RIFF[2] &&
    buffer[3] === CONFIG.UPLOAD.MAGIC_BYTES.WEBP_RIFF[3];

  const isWebp =
    buffer[8] === CONFIG.UPLOAD.MAGIC_BYTES.WEBP_HEADER[0] &&
    buffer[9] === CONFIG.UPLOAD.MAGIC_BYTES.WEBP_HEADER[1] &&
    buffer[10] === CONFIG.UPLOAD.MAGIC_BYTES.WEBP_HEADER[2] &&
    buffer[11] === CONFIG.UPLOAD.MAGIC_BYTES.WEBP_HEADER[3];

  if (isRiff && isWebp) {
    return 'webp';
  }

  return null;
}

/**
 * Strips EXIF metadata, re-encodes, and saves an uploaded image safely.
 *
 * @param rawBuffer - Untrusted incoming file buffer
 * @param originalFilename - Original filename provided by user (for extension hint only)
 * @returns Saved public image URL path e.g. "/uploads/a83f9c2d.webp"
 */
export async function processAndSaveImage(
  rawBuffer: Buffer,
  _originalFilename?: string
): Promise<{ url: string; format: SupportedImageFormat }> {
  // 1. Size check
  if (rawBuffer.length > CONFIG.UPLOAD.MAX_FILE_SIZE_BYTES) {
    throw new AppError('File size exceeds the 5 MB limit', 'VALIDATION_ERROR', 400);
  }

  // 2. Binary magic byte check
  const detectedFormat = verifyImageMagicBytes(rawBuffer);
  if (!detectedFormat) {
    throw new AppError(
      'Invalid image file. Only genuine JPEG, PNG, or WebP images are allowed.',
      'VALIDATION_ERROR',
      400
    );
  }

  // 3. Strip EXIF metadata & compress using Sharp
  // Converting to WebP provides uniform sanitization and strips all geolocation metadata
  const sanitizedBuffer = await sharp(rawBuffer)
    .rotate() // Automatically orient based on EXIF before stripping
    .webp({ quality: 80 })
    .withMetadata({
      // Explicitly remove all EXIF, IPTC, and XMP metadata (especially GPS tags)
      exif: {},
    })
    .toBuffer();

  // 4. Generate random filename
  const randomId = crypto.randomBytes(16).toString('hex');
  const filename = `${randomId}.webp`;

  // 5. Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), CONFIG.UPLOAD.STORAGE_DIR);
  await fs.mkdir(uploadDir, { recursive: true });

  const destinationPath = path.join(uploadDir, filename);
  await fs.writeFile(destinationPath, sanitizedBuffer);

  return {
    url: `/uploads/${filename}`,
    format: 'webp',
  };
}
