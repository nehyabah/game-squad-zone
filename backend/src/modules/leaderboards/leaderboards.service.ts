import type { LeaderboardQueryDto } from './leaderboards.dto';
import { LeaderboardRepo } from './leaderboards.repo';
import type { LeaderboardEntry } from './leaderboards.repo';

/**
 * Leaderboards module business logic.
 */
export class LeaderboardService {
  constructor(private readonly repo: LeaderboardRepo) {}

  getLeaderboard(query: LeaderboardQueryDto): Promise<LeaderboardEntry[]> {
    return this.repo.fetchLeaderboard(query.scope ?? 'global', query.week);
  }
}
