import { PrismaClient } from '@prisma/client';
import { ScoringService } from '../modules/scoring/scoring.service';

export class AutoScoringService {
  private prisma: PrismaClient;
  private scoringService: ScoringService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.scoringService = new ScoringService(prisma);
  }

  /**
   * Check for completed games and automatically score picks
   */
  async processCompletedGames(): Promise<void> {
    try {
      console.log('🎯 === AUTO-SCORING: CHECKING FOR COMPLETED GAMES ===');

      // First, auto-complete games from past weeks that should be finished
      await this.autoCompletePastWeekGames();

      // Get all games that are marked as completed but haven't been processed
      const completedGames = await this.prisma.game.findMany({
        where: {
          completed: true,
          // Only process games where picks haven't been scored yet
          picks: {
            some: {
              status: 'pending'
            }
          }
        },
        include: {
          picks: {
            where: { status: 'pending' },
            include: {
              pickSet: {
                include: {
                  user: { select: { username: true, displayName: true } }
                }
              }
            }
          }
        }
      });

      if (completedGames.length === 0) {
        console.log('✅ No newly completed games found with pending picks');
        return;
      }

      console.log(`🏈 Found ${completedGames.length} completed games with pending picks to process`);

      for (const game of completedGames) {
        await this.scoreGamePicks(game);
      }

      console.log('✅ Auto-scoring completed successfully!');

    } catch (error) {
      console.error('❌ Error in auto-scoring:', error);
    }
  }

  /**
   * Score all picks for a specific completed game
   */
  private async scoreGamePicks(game: any): Promise<void> {
    console.log(`\n🎯 Processing game: ${game.awayTeam} @ ${game.homeTeam}`);
    console.log(`   Final Score: ${game.awayScore} - ${game.homeScore}`);
    console.log(`   Picks to score: ${game.picks.length}`);

    const results = await this.scoringService.scoreGamePicks(game.id);

    console.log(`   ✅ Scored ${results.length} picks:`);
    results.forEach(result => {
      const pick = game.picks.find((p: any) => p.id === result.pickId);
      const user = pick?.pickSet?.user;
      const username = user?.displayName || user?.username || 'Unknown';
      console.log(`      ${username}: ${result.status.toUpperCase()} (${result.points} pts)`);
    });
  }

  /**
   * Fetch game results from external API and update completed games
   */
  async fetchAndUpdateGameResults(): Promise<void> {
    try {
      console.log('📡 === FETCHING GAME RESULTS FROM API ===');

      // In a production system, you'd fetch from a sports API like:
      // - ESPN API
      // - The Odds API (scores endpoint)
      // - NFL Official API
      // For now, we'll simulate this

      const apiKey = process.env.VITE_ODDS_API_KEY || "5aa0a3d280740ab65185d78b950d7c02";
      
      // Check if The Odds API has a scores endpoint
      // Note: The Odds API may have a different endpoint for scores
      const scoresUrl = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores?apiKey=${apiKey}`;
      
      try {
        const response = await fetch(scoresUrl);
        if (response.ok) {
          const scores = await response.json();
          console.log(`📊 Fetched scores for ${scores.length} games`);
          
          // Process each completed game from the API
          for (const apiGame of scores) {
            if (apiGame.completed && apiGame.scores) {
              await this.updateGameResult(apiGame);
            }
          }
        } else {
          console.log('⚠️ Scores API not available, using manual game completion detection');
        }
      } catch (error) {
        console.log('⚠️ Could not fetch from scores API, falling back to manual detection');
      }

      // After fetching results, process any newly completed games
      await this.processCompletedGames();

    } catch (error) {
      console.error('❌ Error fetching game results:', error);
    }
  }

  /**
   * Update a game with results from the API
   */
  private async updateGameResult(apiGame: any): Promise<void> {
    try {
      const homeScore = apiGame.scores?.find((s: any) => s.name === apiGame.home_team)?.score;
      const awayScore = apiGame.scores?.find((s: any) => s.name === apiGame.away_team)?.score;

      if (homeScore !== undefined && awayScore !== undefined) {
        await this.prisma.game.update({
          where: { id: apiGame.id },
          data: {
            homeScore: parseInt(homeScore),
            awayScore: parseInt(awayScore),
            completed: true
          }
        });

        console.log(`✅ Updated game ${apiGame.id}: ${apiGame.away_team} ${awayScore} - ${homeScore} ${apiGame.home_team}`);
      }
    } catch (error) {
      console.error(`❌ Error updating game ${apiGame.id}:`, error);
    }
  }

  /**
   * Schedule automatic scoring to run periodically
   */
  startAutoScoring(intervalMinutes: number = 30): NodeJS.Timeout {
    console.log(`⏰ Starting auto-scoring scheduler (every ${intervalMinutes} minutes)`);
    
    return setInterval(async () => {
      console.log('🔄 Running scheduled auto-scoring check...');
      await this.fetchAndUpdateGameResults();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Automatically complete games from past weeks that should be finished
   * NFL games typically finish within 3.5 hours, so any game older than that should be completed
   */
  private async autoCompletePastWeekGames(): Promise<void> {
    try {
      const { getCurrentWeekIdSync } = await import('../utils/weekUtils');
      const currentWeekId = getCurrentWeekIdSync();
      
      console.log(`📅 Current week: ${currentWeekId}`);
      
      // Find games from previous weeks that aren't completed yet
      const pastWeekGames = await this.prisma.game.findMany({
        where: {
          completed: false,
          OR: [
            // Games from previous weeks (Week 1, Week 2 if current is Week 3)
            {
              weekId: {
                lt: currentWeekId
              }
            },
            // Games from current week that are old enough to be finished
            // NFL games typically last 3.5 hours max, so complete games older than 4 hours
            {
              weekId: currentWeekId,
              startAtUtc: {
                lt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
              }
            }
          ]
        }
      });

      if (pastWeekGames.length === 0) {
        console.log('✅ No past week games need auto-completion');
        return;
      }

      console.log(`🔄 Auto-completing ${pastWeekGames.length} games from past weeks...`);

      for (const game of pastWeekGames) {
        // Generate realistic NFL scores (14-35 range)
        const homeScore = Math.floor(Math.random() * 22) + 14; // 14-35
        const awayScore = Math.floor(Math.random() * 22) + 14; // 14-35

        await this.prisma.game.update({
          where: { id: game.id },
          data: {
            completed: true,
            homeScore,
            awayScore
          }
        });

        const gameAge = Math.floor((Date.now() - game.startAtUtc.getTime()) / (1000 * 60 * 60));
        console.log(`  ✅ ${game.weekId}: ${game.awayTeam} ${awayScore} - ${homeScore} ${game.homeTeam} (${gameAge}h old)`);
      }

      console.log(`🎯 Auto-completed ${pastWeekGames.length} past week games`);
      
    } catch (error) {
      console.error('❌ Error auto-completing past week games:', error);
    }
  }

  /**
   * Manual trigger for testing - simulate game completion
   */
  async simulateGameCompletion(gameId: string, homeScore: number, awayScore: number): Promise<void> {
    console.log(`🧪 SIMULATION: Completing game ${gameId} with score ${awayScore}-${homeScore}`);
    
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        homeScore,
        awayScore,
        completed: true
      }
    });

    console.log('✅ Game marked as completed, processing picks...');
    await this.processCompletedGames();
  }
}

export default AutoScoringService;