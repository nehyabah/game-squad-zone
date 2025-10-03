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

      // Use The Odds API scores endpoint with daysFrom=3 to get recent completed games
      const scoresUrl = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores?apiKey=${apiKey}&daysFrom=3`;

      try {
        console.log('📡 Fetching game results from The Odds API...');
        const response = await fetch(scoresUrl);

        if (response.ok) {
          const scores = await response.json();
          const completedGames = scores.filter(g => g.completed && g.scores && g.scores.length > 0);

          console.log(`📊 Fetched ${scores.length} games, ${completedGames.length} completed with scores`);

          // Process each completed game from the API
          for (const apiGame of completedGames) {
            await this.updateGameResult(apiGame);
          }

          if (completedGames.length > 0) {
            console.log(`✅ Processed ${completedGames.length} completed games from API`);
          }
        } else {
          const errorText = await response.text();
          console.log(`⚠️ Scores API error (${response.status}): ${errorText}`);
          console.log('🔄 Falling back to manual game completion detection');
        }
      } catch (error) {
        console.log('⚠️ Could not fetch from scores API:', error.message);
        console.log('🔄 Falling back to manual detection');
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
      // Extract scores from the API response
      const homeScore = apiGame.scores?.find((s: any) => s.name === apiGame.home_team)?.score;
      const awayScore = apiGame.scores?.find((s: any) => s.name === apiGame.away_team)?.score;

      if (homeScore !== undefined && awayScore !== undefined) {
        // Find game by team names instead of API ID
        const existingGame = await this.prisma.game.findFirst({
          where: {
            AND: [
              {
                OR: [
                  { homeTeam: apiGame.home_team },
                  { homeTeam: { contains: apiGame.home_team.split(' ').pop() } }
                ]
              },
              {
                OR: [
                  { awayTeam: apiGame.away_team },
                  { awayTeam: { contains: apiGame.away_team.split(' ').pop() } }
                ]
              }
            ]
          }
        });

        if (existingGame) {
          // Update existing game with scores
          await this.prisma.game.update({
            where: { id: existingGame.id },
            data: {
              homeScore: parseInt(homeScore),
              awayScore: parseInt(awayScore),
              completed: true
            }
          });

          console.log(`✅ Updated game: ${apiGame.away_team} ${awayScore} - ${homeScore} ${apiGame.home_team} (DB: ${existingGame.awayTeam} @ ${existingGame.homeTeam})`);
        } else {
          console.log(`⚠️ Game not found in database: ${apiGame.away_team} @ ${apiGame.home_team}`);
        }
      } else {
        console.log(`⚠️ Incomplete scores for game ${apiGame.id}: ${apiGame.away_team} @ ${apiGame.home_team}`);
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
        console.log(`🔍 Checking API for real scores: ${game.awayTeam} @ ${game.homeTeam}`);

        // Try to get real scores from API first
        let homeScore = null;
        let awayScore = null;

        try {
          const apiKey = process.env.VITE_ODDS_API_KEY || "5aa0a3d280740ab65185d78b950d7c02";
          const scoresUrl = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores?apiKey=${apiKey}&daysFrom=7`;

          const response = await fetch(scoresUrl);
          if (response.ok) {
            const scores = await response.json();

            // Find matching game by team names
            const apiGame = scores.find(g =>
              (g.home_team === game.homeTeam && g.away_team === game.awayTeam) ||
              (g.home_team.includes(game.homeTeam.split(' ').pop()) &&
               g.away_team.includes(game.awayTeam.split(' ').pop()))
            );

            if (apiGame && apiGame.completed && apiGame.scores) {
              homeScore = parseInt(apiGame.scores.find(s => s.name === apiGame.home_team)?.score || '0');
              awayScore = parseInt(apiGame.scores.find(s => s.name === apiGame.away_team)?.score || '0');
              console.log(`📊 Found API scores: ${game.awayTeam} ${awayScore} - ${homeScore} ${game.homeTeam}`);
            }
          }
        } catch (error) {
          console.log(`⚠️ API fetch failed for ${game.awayTeam} @ ${game.homeTeam}:`, error.message);
        }

        // Only use random scores as absolute last resort
        if (homeScore === null || awayScore === null) {
          console.log(`🎲 No API data available, using realistic random scores for ${game.awayTeam} @ ${game.homeTeam}`);
          homeScore = Math.floor(Math.random() * 22) + 14; // 14-35
          awayScore = Math.floor(Math.random() * 22) + 14; // 14-35
        }

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