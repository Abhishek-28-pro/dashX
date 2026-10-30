/**
 * Prisma Client Singleton Instance
 * Ensures a single database connection pool across serverless route invocations.
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL?.trim();

  // If external PostgreSQL / Supabase URL is provided, use it directly
  if (envUrl && !envUrl.startsWith('file:')) {
    return envUrl;
  }

  // On Vercel / AWS Lambda serverless functions, the root filesystem is read-only.
  // SQLite must operate in /tmp which is the only writable directory.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'seed.db'),
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          try {
            fs.copyFileSync(candidate, tmpDbPath);
            break;
          } catch (e) {
            console.error('[Prisma] Error copying seed database to /tmp:', e);
          }
        }
      }
    }
    return `file:${tmpDbPath}`;
  }

  // Local development
  if (envUrl && envUrl.length > 0) {
    return envUrl;
  }
  return 'file:./dev.db';
}

const resolvedUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = resolvedUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
