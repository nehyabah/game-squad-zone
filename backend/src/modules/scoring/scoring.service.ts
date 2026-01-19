import { PrismaClient } from '@prisma/client';
import { calculateSpreadResult } from '../../utils/spreadCalculator';

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

    let status: string = 'pending';
    let points = 0;
    let result = '';

    try {
      // Use spread calculation instead of simple moneyline
      const spreadResult = calculateSpreadResult(
        homeScore,
        awayScore,
        pick.spreadAtPick,
        pick.choice as 'home' | 'away'
      );

      if (spreadResult.isPush) {
        status = 'pushed';
        points = 0;
        result = 'push:0';
      } else if (spreadResult.userWon) {
        status = 'won';
        points = spreadResult.points; // Usually 10
        result = `won:${points}`;
      } else {
        status = 'lost';
        points = 0;
        result = 'lost:0';
      }

      console.log(`Pick scoring: ${spreadResult.explanation}`);

    } catch (error) {
      console.error(`Spread calculation error for pick ${pickId}:`, error);
      // Fallback to simple moneyline if spread calc fails
      const homeDiff = homeScore - awayScore;
      if (homeDiff === 0) {
        status = 'pushed';
        result = 'push:0';
      } else {
        const homeWon = homeDiff > 0;
        const pickedHome = pick.choice === 'home';
      
        if ((homeWon && pickedHome) || (!homeWon && !pickedHome)) {
          status = 'won';
          points = this.getBasicPoints();
          result = `won:${points}`;
        } else {
          status = 'lost';
          points = 0;
          result = 'lost:0';
        }
      }
    }

    // Calculate payout based on odds and points
    const payout = status === 'won' && pick.odds ? this.calculatePayout(points, pick.odds) : 0;

    // Update the pick in the database with the calculated result
    await this.prisma.pick.update({
      where: { id: pickId },
      data: {
        status: status,
        result: result,
        payout: payout
      }
    });

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
        // Database update now happens inside calculatePickResult
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
  async getUserWeekPoints(userId: string, weekId: string, sport?: string): Promise<number> {
    const pickSet = await this.prisma.pickSet.findFirst({
      where: {
        userId,
        weekId,
        ...(sport && { sport })
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
  async getUserSeasonStats(userId: string, sport?: string): Promise<{
    totalPoints: number;
    wins: number;
    losses: number;
    pushes: number;
    winPercentage: number;
  }> {
    const picks = await this.prisma.pick.findMany({
      where: {
        pickSet: {
          userId,
          ...(sport && { sport })
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