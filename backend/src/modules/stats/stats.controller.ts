import { StatsService } from './stats.service';
import type { PersonalStatsQueryDto, SquadStatsQueryDto, MemberComparisonQueryDto } from './stats.dto';

/**
 * Statistics module HTTP handlers.
 */
export class StatsController {
  constructor(private readonly service: StatsService) {}

  /**
   * Get personal statistics for a user
   */
  async getPersonalStats(query: PersonalStatsQueryDto) {
    return this.service.getPersonalStats(query.userId, query.squadId);
  }

  /**
   * Get squad-wide statistics
   */
  async getSquadStats(query: SquadStatsQueryDto) {
    return this.service.getSquadStats(query.squadId);
  }

  /**
   * Get comparison data for two members
   */
  async getMemberComparison(query: MemberComparisonQueryDto) {
    return this.service.getMemberComparison(
      query.member1Id,
      query.member2Id,
      query.squadId
    );
  }
}
