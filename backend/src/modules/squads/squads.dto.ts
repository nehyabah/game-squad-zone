import { z } from 'zod';
import { createSquadSchema, joinSquadSchema } from './squads.schema';

/**
 * Squads module data transfer objects.
 */
export type CreateSquadInput = z.infer<typeof createSquadSchema>;
export type JoinSquadInput = z.infer<typeof joinSquadSchema>;
