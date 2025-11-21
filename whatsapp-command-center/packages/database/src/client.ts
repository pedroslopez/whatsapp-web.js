/**
 * Prisma Client Singleton
 *
 * Ensures a single Prisma Client instance across the application
 * Handles proper connection pooling and prevents connection leaks
 */

import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prisma Client options with best practices
const prismaOptions = {
  log: [
    {
      emit: 'event' as const,
      level: 'query' as const,
    },
    {
      emit: 'event' as const,
      level: 'error' as const,
    },
    {
      emit: 'event' as const,
      level: 'warn' as const,
    },
  ],
  errorFormat: 'pretty' as const,
};

// Create singleton instance
export const prisma = global.__prisma || new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    console.log('Query: ' + e.query);
    console.log('Duration: ' + e.duration + 'ms');
  });
}

// Handle graceful shutdown
const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
