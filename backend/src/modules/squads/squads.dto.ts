import { z } from 'zod';
import { createSquadSchema, joinSquadSchema } from './squads.schema';

/**
 * Squads module data transfer objects.
 */

// Zod-based types for runtime validation
export type CreateSquadInput = z.infer<typeof createSquadSchema>;
export type JoinSquadInput = z.infer<typeof joinSquadSchema>;

// Simple interface types (keeping for backward compatibility if needed)
export interface CreateSquadDto {
  name: string;
}

// You might want to add a JoinSquadDto for consistency
export interface JoinSquadDto {
  joinCode: string;
}