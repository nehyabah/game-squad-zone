import type { LeaderboardQueryDto } from './leaderboards.dto';
import { LeaderboardService } from './leaderboards.service';

/**
 * Leaderboards module HTTP handlers.
 */
export class LeaderboardController {
  constructor(private readonly service: LeaderboardService) {}

  async get(_query: LeaderboardQueryDto) {
    // TODO: handle leaderboard request
  }
}
