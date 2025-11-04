import { PrismaClient } from '@prisma/client';
import { LeaderboardRepo } from '../leaderboards/leaderboards.repo';

export interface TeamStats {
  team: string;
  picks: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
}

export interface SpreadPerformance {
  range: string;
  wins: number;
  losses: number;
  pushes: number;
  totalPicks: number;
  winRate: number;
}

export interface PickPatterns {
  homeRate: number;
  awayRate: number;
  favoriteRate: number;
  underdogRate: number;
}

export interface WeeklyPerformance {
  weekId: string;
  wins: number;
  losses: number;
  pushes: number;
  points: number;
}

export interface PersonalStatsData {
  totalPicks: number;
  totalWins: number;
  totalLosses: number;
  totalPushes: number;
  winPercentage: number;
  favoriteTeams: TeamStats[];
  avoidedTeams: string[];
  pickPatterns: PickPatterns;
  spreadPerformance: SpreadPerformance[];
  weeklyPerformance: WeeklyPerformance[];
  bestWeek: {
    weekId: string;
    points: number;
    record: string;
  } | null;
}

export interface SquadStatsData {
  mostPickedTeams: TeamStats[];
  pickPatterns: PickPatterns;
  spreadDistribution: {
    range: string;
    count: number;
  }[];
  leader: {
    name: string;
    winPercentage: number;
  } | null;
}

/**
 * Statistics module data access layer.
 */
export class StatsRepo {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly leaderboardRepo: LeaderboardRepo
  ) {}

  /**
   * Get personal statistics for a user
   */
  async getPersonalStats(userId: string, squadId?: string): Promise<PersonalStatsData> {
    // Get all user's picks with game details
    const picks = await this.prisma.pick.findMany({
      where: {
        pickSet: {
          userId,
          ...(squadId && {
            user: {
              squadMembers: {
                some: { squadId }
              }
            }
          })
        }
      },
      include: {
        game: true,
        pickSet: true
      }
    });

    // Calculate favorite teams
    const teamMap = new Map<string, { picks: number; wins: number; losses: number; pushes: number }>();

    picks.forEach(pick => {
      const team = pick.choice === 'home' ? pick.game.homeTeam : pick.game.awayTeam;
      const stats = teamMap.get(team) || { picks: 0, wins: 0, losses: 0, pushes: 0 };

      stats.picks++;
      if (pick.status === 'won') stats.wins++;
      else if (pick.status === 'lost') stats.losses++;
      else if (pick.status === 'pushed') stats.pushes++;

      teamMap.set(team, stats);
    });

    const favoriteTeams: TeamStats[] = Array.from(teamMap.entries())
      .map(([team, stats]) => ({
        team,
        picks: stats.picks,
        wins: stats.wins,
        losses: stats.losses,
        pushes: stats.pushes,
        winRate: stats.picks > 0
          ? Math.round(((stats.wins + stats.pushes * 0.5) / stats.picks) * 100)
          : 0
      }))
      .sort((a, b) => b.picks - a.picks)
      .slice(0, 5);

    // Get all NFL teams and find avoided ones
    const allTeams = await this.getAllNFLTeams();
    const pickedTeams = new Set(Array.from(teamMap.keys()));
    const avoidedTeams = allTeams
      .filter(team => {
        const pickCount = teamMap.get(team)?.picks || 0;
        return pickCount <= 1;
      });

    // Calculate pick patterns
    let homeCount = 0;
    let awayCount = 0;
    let favoriteCount = 0;
    let underdogCount = 0;

    picks.forEach(pick => {
      if (pick.choice === 'home') homeCount++;
      else awayCount++;

      // Negative spread = favorite, positive spread = underdog
      if (pick.spreadAtPick < 0) favoriteCount++;
      else if (pick.spreadAtPick > 0) underdogCount++;
    });

    const totalPicks = picks.length;
    const pickPatterns: PickPatterns = {
      homeRate: totalPicks > 0 ? Math.round((homeCount / totalPicks) * 100) : 0,
      awayRate: totalPicks > 0 ? Math.round((awayCount / totalPicks) * 100) : 0,
      favoriteRate: totalPicks > 0 ? Math.round((favoriteCount / totalPicks) * 100) : 0,
      underdogRate: totalPicks > 0 ? Math.round((underdogCount / totalPicks) * 100) : 0
    };

    // Calculate spread performance
    const spreadRanges = [
      { range: 'Small (<3)', min: 0, max: 3 },
      { range: 'Medium (3-7)', min: 3, max: 7 },
      { range: 'Large (>7)', min: 7, max: Infinity }
    ];

    const spreadPerformance: SpreadPerformance[] = spreadRanges.map(({ range, min, max }) => {
      const rangePicks = picks.filter(pick => {
        const absSpread = Math.abs(pick.spreadAtPick);
        return absSpread >= min && absSpread < max;
      });

      const wins = rangePicks.filter(p => p.status === 'won').length;
      const losses = rangePicks.filter(p => p.status === 'lost').length;
      const pushes = rangePicks.filter(p => p.status === 'pushed').length;
      const total = rangePicks.length;

      return {
        range,
        wins,
        losses,
        pushes,
        totalPicks: total,
        winRate: total > 0 ? Math.round(((wins + pushes * 0.5) / total) * 100) : 0
      };
    });

    // Find best week
    const weeklyStats = new Map<string, { points: number; wins: number; losses: number; pushes: number }>();

    picks.forEach(pick => {
      const weekId = pick.pickSet.weekId;
      const stats = weeklyStats.get(weekId) || { points: 0, wins: 0, losses: 0, pushes: 0 };

      if (pick.status === 'won' && pick.result) {
        const points = parseInt(pick.result.split(':')[1] || '0');
        stats.points += points;
        stats.wins++;
      } else if (pick.status === 'lost') {
        stats.losses++;
      } else if (pick.status === 'pushed') {
        stats.pushes++;
      }

      weeklyStats.set(weekId, stats);
    });

    let bestWeek: { weekId: string; points: number; record: string } | null = null;
    let maxPoints = 0;

    weeklyStats.forEach((stats, weekId) => {
      if (stats.points > maxPoints) {
        maxPoints = stats.points;
        bestWeek = {
          weekId,
          points: stats.points,
          record: `${stats.wins}-${stats.losses}-${stats.pushes}`
        };
      }
    });

    // Calculate overall totals from all picks
    const totalWins = picks.filter(p => p.status === 'won').length;
    const totalLosses = picks.filter(p => p.status === 'lost').length;
    const totalPushes = picks.filter(p => p.status === 'pushed').length;
    // totalPicks already declared above at line 137
    const winPercentage = totalPicks > 0
      ? Math.round(((totalWins + totalPushes * 0.5) / totalPicks) * 100)
      : 0;

    // Convert weeklyStats map to array and sort by week
    const weeklyPerformance: WeeklyPerformance[] = Array.from(weeklyStats.entries())
      .map(([weekId, stats]) => ({
        weekId,
        wins: stats.wins,
        losses: stats.losses,
        pushes: stats.pushes,
        points: stats.points
      }))
      .sort((a, b) => a.weekId.localeCompare(b.weekId));

    return {
      totalPicks,
      totalWins,
      totalLosses,
      totalPushes,
      winPercentage,
      favoriteTeams,
      avoidedTeams,
      pickPatterns,
      spreadPerformance,
      weeklyPerformance,
      bestWeek
    };
  }

  /**
   * Get squad-wide statistics
   */
  async getSquadStats(squadId: string): Promise<SquadStatsData> {
    // Get all picks from squad members
    const picks = await this.prisma.pick.findMany({
      where: {
        pickSet: {
          user: {
            squadMembers: {
              some: { squadId }
            }
          }
        }
      },
      include: {
        game: true
      }
    });

    // Calculate most picked teams
    const teamMap = new Map<string, { picks: number; wins: number; losses: number; pushes: number }>();

    picks.forEach(pick => {
      const team = pick.choice === 'home' ? pick.game.homeTeam : pick.game.awayTeam;
      const stats = teamMap.get(team) || { picks: 0, wins: 0, losses: 0, pushes: 0 };

      stats.picks++;
      if (pick.status === 'won') stats.wins++;
      else if (pick.status === 'lost') stats.losses++;
      else if (pick.status === 'pushed') stats.pushes++;

      teamMap.set(team, stats);
    });

    const mostPickedTeams: TeamStats[] = Array.from(teamMap.entries())
      .map(([team, stats]) => ({
        team,
        picks: stats.picks,
        wins: stats.wins,
        losses: stats.losses,
        pushes: stats.pushes,
        winRate: stats.picks > 0
          ? Math.round(((stats.wins + stats.pushes * 0.5) / stats.picks) * 100)
          : 0
      }))
      .sort((a, b) => b.picks - a.picks);

    // Calculate pick patterns
    let homeCount = 0;
    let awayCount = 0;
    let favoriteCount = 0;
    let underdogCount = 0;

    picks.forEach(pick => {
      if (pick.choice === 'home') homeCount++;
      else awayCount++;

      if (pick.spreadAtPick < 0) favoriteCount++;
      else if (pick.spreadAtPick > 0) underdogCount++;
    });

    const totalPicks = picks.length;
    const pickPatterns: PickPatterns = {
      homeRate: totalPicks > 0 ? Math.round((homeCount / totalPicks) * 100) : 0,
      awayRate: totalPicks > 0 ? Math.round((awayCount / totalPicks) * 100) : 0,
      favoriteRate: totalPicks > 0 ? Math.round((favoriteCount / totalPicks) * 100) : 0,
      underdogRate: totalPicks > 0 ? Math.round((underdogCount / totalPicks) * 100) : 0
    };

    // Calculate spread distribution
    const spreadRanges = [
      { range: '<3 pts', min: 0, max: 3 },
      { range: '3-7 pts', min: 3, max: 7 },
      { range: '>7 pts', min: 7, max: Infinity }
    ];

    const spreadDistribution = spreadRanges.map(({ range, min, max }) => {
      const count = picks.filter(pick => {
        const absSpread = Math.abs(pick.spreadAtPick);
        return absSpread >= min && absSpread < max;
      }).length;

      return { range, count };
    });

    // Get squad leader from the leaderboard (guarantees it matches the leaderboard)
    const leaderboard = await this.leaderboardRepo.fetchSquadLeaderboard(squadId);
    const leader = leaderboard.length > 0 && leaderboard[0].rank === 1
      ? {
          name: leaderboard[0].displayName || leaderboard[0].username,
          winPercentage: Math.round(leaderboard[0].winPercentage)
        }
      : null;

    return {
      mostPickedTeams,
      pickPatterns,
      spreadDistribution,
      leader
    };
  }

  /**
   * Get comparison data for two members
   */
  async getMemberComparison(member1Id: string, member2Id: string, squadId: string) {
    // Get picks for both members
    const member1Picks = await this.getPersonalStats(member1Id, squadId);
    const member2Picks = await this.getPersonalStats(member2Id, squadId);

    // Get weekly performance for head-to-head
    const member1WeeklyPoints = await this.getUserWeeklyPoints(member1Id);
    const member2WeeklyPoints = await this.getUserWeeklyPoints(member2Id);

    // Calculate head-to-head
    let member1Wins = 0;
    let member2Wins = 0;

    const commonWeeks = new Set([
      ...Array.from(member1WeeklyPoints.keys()),
      ...Array.from(member2WeeklyPoints.keys())
    ]);

    commonWeeks.forEach(weekId => {
      const m1Points = member1WeeklyPoints.get(weekId) || 0;
      const m2Points = member2WeeklyPoints.get(weekId) || 0;

      if (m1Points > m2Points) member1Wins++;
      else if (m2Points > m1Points) member2Wins++;
    });

    return {
      member1Stats: member1Picks,
      member2Stats: member2Picks,
      headToHead: {
        member1Wins,
        member2Wins
      }
    };
  }

  /**
   * Helper: Get user's weekly points map
   */
  private async getUserWeeklyPoints(userId: string): Promise<Map<string, number>> {
    const pickSets = await this.prisma.pickSet.findMany({
      where: { userId },
      include: {
        picks: true
      }
    });

    const weeklyPoints = new Map<string, number>();

    pickSets.forEach(pickSet => {
      let weekPoints = 0;
      pickSet.picks.forEach(pick => {
        if (pick.status === 'won' && pick.result) {
          const points = parseInt(pick.result.split(':')[1] || '0');
          weekPoints += points;
        }
      });
      weeklyPoints.set(pickSet.weekId, weekPoints);
    });

    return weeklyPoints;
  }

  /**
   * Helper: Get all NFL teams
   */
  private async getAllNFLTeams(): Promise<string[]> {
    const teams = await this.prisma.game.findMany({
      distinct: ['homeTeam'],
      select: { homeTeam: true }
    });

    return teams.map(t => t.homeTeam);
  }
}
