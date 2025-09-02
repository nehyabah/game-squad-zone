/**
 * Picks module data transfer objects.
 */
export interface SubmitPicksInput {
  weekId: string;
  picks: { gameId: string; selection: 'home' | 'away' }[];
  tiebreakerScore?: number;
}

export interface SubmitPicksDto {
  weekId: string;
  picks: { gameId: string; selection: 'home' | 'away' }[];
  tiebreakerScore?: number;
}