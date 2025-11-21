/**
 * @repo/database
 *
 * Shared Prisma database client for WhatsApp Command Center
 *
 * Usage:
 * ```typescript
 * import { prisma } from '@repo/database';
 *
 * const users = await prisma.user.findMany();
 * ```
 */

export * from '@prisma/client';
export { prisma } from './client';
