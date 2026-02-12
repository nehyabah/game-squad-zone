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
  async fetchWeeklyLeaderboard(weekId: string, sport?: string): Promise<WeeklyLeaderboardEntry[]> {
    // Get all users who made picks for this week
    const pickSets = await this.prisma.pickSet.findMany({
      where: {
        weekId,
        ...(sport && { sport })
      },
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
      // Get season stats for overall win percentage ranking (filtered by sport)
      const seasonStats = await this.scoringService.getUserSeasonStats(pickSet.user.id, sport);

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
  async fetchSeasonLeaderboard(sport?: string): Promise<LeaderboardEntry[]> {
    // Get all users who have made picks
    const users = await this.prisma.user.findMany({
      where: {
        pickSets: {
          some: {
            ...(sport && { sport })
          }
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
      const stats = await this.scoringService.getUserSeasonStats(user.id, sport);
      
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
  async fetchSquadLeaderboard(squadId: string, weekId?: string, scope?: string): Promise<LeaderboardEntry[]> {
    // First get squad to know its sport
    const squad = await this.prisma.squad.findUnique({
      where: { id: squadId },
      select: { sport: true }
    });

    const sport = squad?.sport;

    // Handle Six Nations squads differently
    if (sport === 'six-nations') {
      return this.fetchSixNationsSquadLeaderboard(squadId, weekId, scope);
    }

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
        // Get weekly stats (filtered by squad's sport)
        const points = await this.scoringService.getUserWeekPoints(member.userId, weekId, sport);

        // Get pick stats for the week
        const pickSet = await this.prisma.pickSet.findUnique({
          where: {
            userId_weekId_sport: {
              userId: member.userId,
              weekId,
              sport: sport || 'nfl'
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
        // Get season stats (filtered by squad's sport)
        stats = await this.scoringService.getUserSeasonStats(member.userId, sport);
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
   * Get Six Nations squad leaderboard
   * Shows cumulative stats across ALL rounds for the tournament
   * Note: weekId parameter is ignored for Six Nations squads (we show all-time stats)
   */
  private async fetchSixNationsSquadLeaderboard(squadId: string, roundId?: string, scope?: string): Promise<LeaderboardEntry[]> {
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

    // Get member user IDs
    const memberUserIds = squadMembers.map(m => m.userId);

    // Build where clause based on scope
    const whereClause: any = {
      userId: { in: memberUserIds }
    };

    if (scope === 'total') {
      // No round filter — aggregate across ALL rounds
    } else if (roundId) {
      whereClause.question = { match: { roundId } };
    } else {
      // Default to active round only
      whereClause.question = { match: { round: { isActive: true } } };
    }

    const answers = await this.prisma.sixNationsAnswer.findMany({
      where: whereClause,
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
        question: true
      }
    });

    // Group by user and calculate stats
    const userScores = new Map<string, {
      user: any;
      totalPoints: number;
      correctAnswers: number;
      incorrectAnswers: number;
      totalAnswers: number;
    }>();

    // Initialize all squad members with zero stats
    for (const member of squadMembers) {
      userScores.set(member.userId, {
        user: member.user,
        totalPoints: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalAnswers: 0
      });
    }

    // Populate with actual answer data
    for (const answer of answers) {
      const userId = answer.userId;
      const existing = userScores.get(userId)!;

      existing.totalAnswers += 1;
      if (answer.isCorrect === true) {
        existing.totalPoints += answer.question.points;
        existing.correctAnswers += 1;
      } else if (answer.isCorrect === false) {
        existing.incorrectAnswers += 1;
      }
    }

    // Convert to leaderboard entries
    const entries: LeaderboardEntry[] = Array.from(userScores.values()).map(entry => {
      // For Six Nations, use correctAnswers as wins, incorrectAnswers as losses
      // Pending answers (not yet scored) = totalAnswers - correctAnswers - incorrectAnswers
      const pendingAnswers = entry.totalAnswers - entry.correctAnswers - entry.incorrectAnswers;

      // Calculate win percentage if there are answers
      const winPercentage = entry.totalAnswers > 0
        ? Math.round((entry.correctAnswers / entry.totalAnswers) * 100 * 100) / 100
        : 0;

      return {
        userId: entry.user.id,
        username: entry.user.username,
        displayName: entry.user.displayName,
        firstName: entry.user.firstName,
        lastName: entry.user.lastName,
        points: entry.totalPoints,
        wins: entry.correctAnswers,
        losses: entry.incorrectAnswers,
        pushes: pendingAnswers, // Use pending answers as "pushes"
        winPercentage,
        rank: 0 // Will be assigned after sorting
      };
    });

    // Sort by total points (descending), then by correct answers (descending)
    entries.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.wins - a.wins;
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
