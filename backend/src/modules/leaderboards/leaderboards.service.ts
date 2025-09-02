import type { LeaderboardQueryDto } from './leaderboards.dto';
import { LeaderboardRepo } from './leaderboards.repo';
import type { LeaderboardEntry, WeeklyLeaderboardEntry } from './leaderboards.repo';

/**
 * Leaderboards module business logic.
 */
export class LeaderboardService {
  constructor(private readonly repo: LeaderboardRepo) {}

  /**
   * Get leaderboard based on query parameters
   */
  async getLeaderboard(query: LeaderboardQueryDto): Promise<LeaderboardEntry[]> {
    return this.repo.fetchLeaderboard(query.scope ?? 'global', query.week, query.squadId);
  }

  /**
   * Get weekly global leaderboard
   */
  async getWeeklyLeaderboard(weekId: string): Promise<WeeklyLeaderboardEntry[]> {
    return this.repo.fetchWeeklyLeaderboard(weekId);
  }

  /**
   * Get season global leaderboard
   */
  async getSeasonLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.repo.fetchSeasonLeaderboard();
  }

  /**
   * Get squad leaderboard
   */
  async getSquadLeaderboard(squadId: string, weekId?: string): Promise<LeaderboardEntry[]> {
    return this.repo.fetchSquadLeaderboard(squadId, weekId);
  }

  /**
   * Get user's global rank
   */
  async getUserGlobalRank(userId: string, weekId?: string): Promise<{ rank: number; totalUsers: number } | null> {
    return this.repo.getUserGlobalRank(userId, weekId);
  }
}
