import { z } from 'zod';

/**
 * Validation schemas for statistics module
 */

export const personalStatsQuerySchema = z.object({
  userId: z.string().min(1),
  squadId: z.string().optional(),
});

export const squadStatsQuerySchema = z.object({
  squadId: z.string().min(1),
});

export const memberComparisonQuerySchema = z.object({
  member1Id: z.string().min(1),
  member2Id: z.string().min(1),
  squadId: z.string().min(1),
});
