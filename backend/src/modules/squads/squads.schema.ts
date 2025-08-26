import { z } from 'zod';

/**
 * Squads module validation schemas.
 */
export const createSquadSchema = z.object({
  name: z.string().min(1),
});

export const joinSquadSchema = z.object({
  joinCode: z.string().min(1),
});

export const squadSchemas = {
  createSquadSchema,
  joinSquadSchema,
};

export type CreateSquadSchema = typeof createSquadSchema;
export type JoinSquadSchema = typeof joinSquadSchema;
