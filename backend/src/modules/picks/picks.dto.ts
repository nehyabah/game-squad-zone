import { z } from 'zod';
import { createPickSchema } from './picks.schema';

/**
 * Picks module data transfer objects.
 */
export type CreatePickInput = z.infer<typeof createPickSchema>;

export interface CreatePickDto {
  gameId: string;
  selection: 'home' | 'away';
}
