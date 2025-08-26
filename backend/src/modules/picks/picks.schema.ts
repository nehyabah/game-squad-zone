import { z } from 'zod';

/**
 * Picks module validation schemas.
 */
export const submitPicksSchema = z.object({
  weekId: z.string().min(1),
  picks: z
    .array(
      z.object({
        gameId: z.string().min(1),
        selection: z.enum(['home', 'away']),
      }),
    )
    .length(3), // Enforce exactly 3 picks
  tiebreakerScore: z.number().int().min(0).optional(),
});

export const pickSchemas = {
  submitPicksSchema,
};

export type SubmitPicksSchema = typeof submitPicksSchema;