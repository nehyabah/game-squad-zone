import { z } from 'zod';

/**
 * Picks module validation schemas.
 */
export const createPickSchema = z.object({
  gameId: z.string().min(1),
  selection: z.enum(['home', 'away']),
});

export const pickSchemas = {
  createPickSchema,
};

export type CreatePickSchema = typeof createPickSchema;
