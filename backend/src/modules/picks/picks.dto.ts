/**
 * Picks module data transfer objects.
 */
export interface SubmitPicksInput {
  weekId: string;
  picks: {
    gameId: string;
    selection: "home" | "away";
    spreadAtPick?: number; // Add this field
  }[];
  tiebreakerScore?: number;
}

export interface SubmitPicksDto {
  weekId: string;
  picks: {
    gameId: string;
    selection: "home" | "away";
    spreadAtPick?: number; // Add this field
  }[];
  tiebreakerScore?: number;
}
