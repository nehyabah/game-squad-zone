import { PrismaClient } from '@prisma/client';
import { ScoringService } from '../scoring/scoring.service';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  points: number;
  wins: number;
  losses: number;
  pushes: number;
  winPercentage: number;
  rank: number;
}

export interface WeeklyLeaderboardEntry extends LeaderboardEntry {
  weekId: string;
}

/**
 * Leaderboards module data access layer.
 */
export class LeaderboardRepo {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly scoringService: ScoringService
  ) {}

  /**
   * Get global weekly leaderboard
   */
  async fetchWeeklyLeaderboard(weekId: string): Promise<WeeklyLeaderboardEntry[]> {
    // Get all users who made picks for this week
    const pickSets = await this.prisma.pickSet.findMany({
      where: { weekId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            firstName: true,
            lastName: true
          }
        },
        picks: {
          include: {
            game: true
          }
        }
      }
    });

    const entries: WeeklyLeaderboardEntry[] = [];

    for (const pickSet of pickSets) {
      // Get season stats for overall win percentage ranking
      const seasonStats = await this.scoringService.getUserSeasonStats(pickSet.user.id);

      // Get weekly points for this specific week
      let weeklyPoints = 0;
      for (const pick of pickSet.picks) {
        if (pick.status === 'won' && pick.result) {
          const pickPoints = parseInt(pick.result.split(':')[1] || '0');
          weeklyPoints += pickPoints;
        }
      }

      entries.push({
        userId: pickSet.user.id,
        username: pickSet.user.username,
        displayName: pickSet.user.displayName,
        firstName: pickSet.user.firstName,
        lastName: pickSet.user.lastName,
        points: weeklyPoints, // Weekly points for this specific week
        wins: seasonStats.wins, // Season totals for ranking
        losses: seasonStats.losses, // Season totals for ranking
        pushes: seasonStats.pushes, // Season totals for ranking
        winPercentage: seasonStats.winPercentage, // Season win percentage for ranking
        weekId,
        rank: 0 // Will be assigned after sorting
      });
    }

    // Sort by win percentage descending, then by points
    entries.sort((a, b) => {
      if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
      return b.points - a.points;
    });

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  /**
   * Get global season leaderboard
   */
  async fetchSeasonLeaderboard(): Promise<LeaderboardEntry[]> {
    // Get all users who have made picks
    const users = await this.prisma.user.findMany({
      where: {
        pickSets: {
          some: {}
        }
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        firstName: true,
        lastName: true
      }
    });

    const entries: LeaderboardEntry[] = [];

    for (const user of users) {
      const stats = await this.scoringService.getUserSeasonStats(user.id);
      
      entries.push({
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        points: stats.totalPoints,
        wins: stats.wins,
        losses: stats.losses,
        pushes: stats.pushes,
        winPercentage: stats.winPercentage,
        rank: 0 // Will be assigned after sorting
      });
    }

    // Sort by win percentage descending, then by points
    entries.sort((a, b) => {
      if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
      return b.points - a.points;
    });

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  /**
   * Get squad leaderboard for a specific squad and week
   */
  async fetchSquadLeaderboard(squadId: string, weekId?: string): Promise<LeaderboardEntry[]> {
    // Get squad members
    const squadMembers = await this.prisma.squadMember.findMany({
      where: { squadId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const entries: LeaderboardEntry[] = [];

    for (const member of squadMembers) {
      let stats;
      
      if (weekId) {
        // Get weekly stats
        const points = await this.scoringService.getUserWeekPoints(member.userId, weekId);
        
        // Get pick stats for the week
        const pickSet = await this.prisma.pickSet.findUnique({
          where: {
            userId_weekId: {
              userId: member.userId,
              weekId
            }
          },
          include: { picks: true }
        });

        let wins = 0, losses = 0, pushes = 0;
        if (pickSet) {
          pickSet.picks.forEach(pick => {
            switch (pick.status) {
              case 'won': wins++; break;
              case 'lost': losses++; break;
              case 'pushed': pushes++; break;
            }
          });
        }

        // New formula: (wins + pushes/2) / total_games
        const totalGames = wins + losses + pushes;
        const winPercentage = totalGames > 0 ? ((wins + (pushes / 2)) / totalGames) * 100 : 0;

        stats = {
          totalPoints: points,
          wins,
          losses,
          pushes,
          winPercentage: Math.round(winPercentage * 100) / 100
        };
      } else {
        // Get season stats
        stats = await this.scoringService.getUserSeasonStats(member.userId);
      }

      entries.push({
        userId: member.user.id,
        username: member.user.username,
        displayName: member.user.displayName,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        points: stats.totalPoints,
        wins: stats.wins,
        losses: stats.losses,
        pushes: stats.pushes,
        winPercentage: stats.winPercentage,
        rank: 0 // Will be assigned after sorting
      });
    }

    // Sort by win percentage descending, then by points
    entries.sort((a, b) => {
      if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
      return b.points - a.points;
    });

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  /**
   * Get user's rank in global leaderboard
   */
  async getUserGlobalRank(userId: string, weekId?: string): Promise<{ rank: number; totalUsers: number } | null> {
    const leaderboard = weekId 
      ? await this.fetchWeeklyLeaderboard(weekId)
      : await this.fetchSeasonLeaderboard();

    const userEntry = leaderboard.find(entry => entry.userId === userId);
    
    if (!userEntry) return null;

    return {
      rank: userEntry.rank,
      totalUsers: leaderboard.length
    };
  }

  /**
   * Generic fetch leaderboard method for backward compatibility
   */
  async fetchLeaderboard(scope: 'squad' | 'global', weekId?: string, squadId?: string): Promise<LeaderboardEntry[]> {
    if (scope === 'squad' && squadId) {
      return this.fetchSquadLeaderboard(squadId, weekId);
    } else if (scope === 'global') {
      return weekId ? await this.fetchWeeklyLeaderboard(weekId) : await this.fetchSeasonLeaderboard();
    }
    
    return [];
  }
}
