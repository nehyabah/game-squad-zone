import { StatsRepo, PersonalStatsData, SquadStatsData } from './stats.repo';

/**
 * Statistics module business logic.
 */
export class StatsService {
  constructor(private readonly repo: StatsRepo) {}

  /**
   * Get personal statistics for a user
   */
  async getPersonalStats(userId: string, squadId?: string): Promise<PersonalStatsData> {
    return this.repo.getPersonalStats(userId, squadId);
  }

  /**
   * Get squad-wide statistics
   */
  async getSquadStats(squadId: string): Promise<SquadStatsData> {
    return this.repo.getSquadStats(squadId);
  }

  /**
   * Get comparison data for two members
   */
  async getMemberComparison(member1Id: string, member2Id: string, squadId: string) {
    return this.repo.getMemberComparison(member1Id, member2Id, squadId);
  }
}
