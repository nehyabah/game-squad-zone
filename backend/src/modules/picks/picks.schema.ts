import { z } from 'zod';

/**
 * Picks module validation schemas.
 */
export const submitPicksSchema = z.object({
  squadId: z.string().min(1),
  weekId: z.string().min(1),
  picks: z
    .array(
      z.object({
        gameId: z.string().min(1),
        selection: z.enum(['home', 'away']),
      }),
    )
    .min(1),
  tiebreakerScore: z.number().optional(),
});

export const pickSchemas = {
  submitPicksSchema,
};

export type SubmitPicksSchema = typeof submitPicksSchema;
