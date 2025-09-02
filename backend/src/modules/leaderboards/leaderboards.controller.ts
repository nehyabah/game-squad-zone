import type { LeaderboardQueryDto } from './leaderboards.dto';
import { LeaderboardService } from './leaderboards.service';

/**
 * Leaderboards module HTTP handlers.
 */
export class LeaderboardController {
  constructor(private readonly service: LeaderboardService) {}

  async get(query: LeaderboardQueryDto) {
    return this.service.getLeaderboard(query);
  }

  async getWeekly(weekId: string) {
    return this.service.getWeeklyLeaderboard(weekId);
  }

  async getSeason() {
    return this.service.getSeasonLeaderboard();
  }

  async getSquad(squadId: string, weekId?: string) {
    return this.service.getSquadLeaderboard(squadId, weekId);
  }

  async getUserRank(userId: string, weekId?: string) {
    return this.service.getUserGlobalRank(userId, weekId);
  }
}
