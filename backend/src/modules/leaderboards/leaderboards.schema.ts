import { z } from 'zod';

/**
 * Leaderboards module validation schemas.
 */
export const leaderboardQuerySchema = z.object({
  scope: z.enum(['squad', 'global']).optional(),
  week: z.string().optional(),
  squadId: z.string().optional(),
});

export const leaderboardSchemas = {
  leaderboardQuerySchema,
};

export type LeaderboardQuerySchema = typeof leaderboardQuerySchema;
