import { PrismaClient } from '@prisma/client';

export interface ScoringResult {
  pickId: string;
  gameId: string;
  status: string;
  points: number;
  payout?: number;
}

/**
 * Scoring service handles pick result calculation and point assignment
 */
export class ScoringService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Calculate points for a single pick based on game result
   */
  async calculatePickResult(pickId: string): Promise<ScoringResult | null> {
    const pick = await this.prisma.pick.findUnique({
      where: { id: pickId },
      include: { game: true }
    });

    if (!pick || !pick.game) {
      return null;
    }

    const { game } = pick;

    // Only score completed games
    if (!game.completed || game.homeScore === null || game.awayScore === null) {
      return { pickId, gameId: game.id, status: 'pending', points: 0 };
    }

    const homeScore = game.homeScore;
    const awayScore = game.awayScore;
    const homeDiff = homeScore - awayScore;
    
    let status: string = 'pending';
    let points = 0;

    // Simple moneyline calculation based on choice (home/away)
    if (homeDiff === 0) {
      status = 'pushed';
    } else {
      const homeWon = homeDiff > 0;
      const pickedHome = pick.choice === 'home';
      
      if ((homeWon && pickedHome) || (!homeWon && !pickedHome)) {
        status = 'won';
        points = this.getBasicPoints();
      } else {
        status = 'lost';
      }
    }

    // Calculate payout based on odds and points
    const payout = status === 'won' && pick.odds ? this.calculatePayout(points, pick.odds) : 0;

    return {
      pickId,
      gameId: game.id,
      status,
      points,
      payout
    };
  }

  /**
   * Calculate payout based on American odds
   */
  private calculatePayout(basePoints: number, odds: number): number {
    if (odds > 0) {
      // Positive odds: +150 means win $150 on $100 bet
      return basePoints * (1 + odds / 100);
    } else {
      // Negative odds: -150 means bet $150 to win $100
      return basePoints * (1 + 100 / Math.abs(odds));
    }
  }

  /**
   * Basic point value for winning picks
   */
  private getBasicPoints(): number { return 10; }

  /**
   * Score all picks for a specific game
   */
  async scoreGamePicks(gameId: string): Promise<ScoringResult[]> {
    const picks = await this.prisma.pick.findMany({
      where: { gameId },
      include: { game: true }
    });

    const results: ScoringResult[] = [];
    
    for (const pick of picks) {
      const result = await this.calculatePickResult(pick.id);
      if (result) {
        results.push(result);
        
        // Update pick in database
        await this.prisma.pick.update({
          where: { id: pick.id },
          data: {
            status: result.status,
            result: `${result.status}:${result.points}`,
            payout: result.payout
          }
        });
      }
    }

    return results;
  }

  /**
   * Score all picks for a specific week
   */
  async scoreWeekPicks(weekId: string): Promise<ScoringResult[]> {
    const games = await this.prisma.game.findMany({
      where: { 
        weekId,
        completed: true
      }
    });

    const results: ScoringResult[] = [];
    
    for (const game of games) {
      const gameResults = await this.scoreGamePicks(game.id);
      results.push(...gameResults);
    }

    return results;
  }

  /**
   * Get user's total points for a week
   */
  async getUserWeekPoints(userId: string, weekId: string): Promise<number> {
    const pickSet = await this.prisma.pickSet.findUnique({
      where: {
        userId_weekId: {
          userId,
          weekId
        }
      },
      include: {
        picks: {
          where: {
            status: 'won'
          }
        }
      }
    });

    if (!pickSet) return 0;

    let totalPoints = 0;
    for (const pick of pickSet.picks) {
      if (pick.result) {
        const points = parseInt(pick.result.split(':')[1] || '0');
        totalPoints += points;
      }
    }

    return totalPoints;
  }

  /**
   * Get user's season statistics
   */
  async getUserSeasonStats(userId: string): Promise<{
    totalPoints: number;
    wins: number;
    losses: number;
    pushes: number;
    winPercentage: number;
  }> {
    const picks = await this.prisma.pick.findMany({
      where: {
        pickSet: {
          userId
        }
      }
    });

    let totalPoints = 0;
    let wins = 0;
    let losses = 0;
    let pushes = 0;

    for (const pick of picks) {
      switch (pick.status) {
        case 'won':
          wins++;
          if (pick.result) {
            totalPoints += parseInt(pick.result.split(':')[1] || '0');
          }
          break;
        case 'lost':
          losses++;
          break;
        case 'pushed':
          pushes++;
          break;
      }
    }

    // New formula: (wins + pushes/2) / total_games
    // Total games = total picks (wins + losses + pushes)
    const totalGames = wins + losses + pushes;
    const winPercentage = totalGames > 0 ? ((wins + (pushes / 2)) / totalGames) * 100 : 0;

    return {
      totalPoints,
      wins,
      losses,
      pushes,
      winPercentage: Math.round(winPercentage * 100) / 100
    };
  }
}