export interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
}

/**
 * Leaderboards module data access layer.
 */
export class LeaderboardRepo {
  async fetchLeaderboard(
    _scope: 'squad' | 'global',
    _week?: number,
  ): Promise<LeaderboardEntry[]> {
    // TODO: replace with real Prisma queries
    return [
      { userId: '1', username: 'Alice', points: 100 },
      { userId: '2', username: 'Bob', points: 80 },
    ];
  }
}
