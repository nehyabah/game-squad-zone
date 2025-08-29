import { z } from 'zod';
import { submitPicksSchema } from './picks.schema';

/**
 * Picks module data transfer objects.
 */
export type SubmitPicksInput = z.infer<typeof submitPicksSchema>;

export interface SubmitPicksDto {
  weekId: string;
  picks: { gameId: string; selection: 'home' | 'away' }[];
  tiebreakerScore?: number;
}