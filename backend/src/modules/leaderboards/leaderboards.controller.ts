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
}
