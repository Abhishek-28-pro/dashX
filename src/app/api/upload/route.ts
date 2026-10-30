import { NextRequest, NextResponse } from 'next/server';
import { processAndSaveImage } from '@/lib/security/image';
import { createErrorResponse, AppError } from '@/lib/errors';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { CONFIG } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    // Rate limit image uploads (10 uploads per min per IP)
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    checkRateLimit(
      `upload:${clientIp}`,
      CONFIG.SECURITY.RATE_LIMIT_SUBMIT_WINDOW_MS,
      CONFIG.SECURITY.RATE_LIMIT_SUBMIT_MAX_REQUESTS
    );

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      throw new AppError('No file provided in form data', 'VALIDATION_ERROR', 400);
    }

    const blob = file as Blob;

    if (blob.size > CONFIG.UPLOAD.MAX_FILE_SIZE_BYTES) {
      throw new AppError(
        `File exceeds maximum permitted size of 5 MB (${Math.round(blob.size / 1024 / 1024)} MB received)`,
        'VALIDATION_ERROR',
        400
      );
    }

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Hardened image processing: Magic byte verification + EXIF metadata strip
    const { url, format } = await processAndSaveImage(buffer, (file as File).name);

    return NextResponse.json(
      {
        success: true,
        url,
        format,
        message: 'Image validated, EXIF stripped, and saved securely',
      },
      { status: 201 }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
