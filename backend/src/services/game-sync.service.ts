import { PrismaClient } from '@prisma/client';
import { getCurrentWeekIdSync } from '../utils/weekUtils';
import { syncGamesOnStartup } from '../startup/sync-games';

/**
 * Game Sync Service - Handles automatic caching of new week spreads
 */
export class GameSyncService {
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Start the automatic game sync scheduler
   * Runs every hour and checks if it's Wednesday to cache new week spreads
   */
  startGameSyncScheduler(): NodeJS.Timeout {
    console.log('⏰ Starting game sync scheduler (every 1 hour)');

    this.syncInterval = setInterval(async () => {
      await this.checkAndSyncNewWeek();
    }, 60 * 60 * 1000); // Every hour

    // Also run immediately on startup
    setTimeout(() => {
      this.checkAndSyncNewWeek();
    }, 5000); // 5 second delay after startup

    return this.syncInterval;
  }

  /**
   * Check if we need to cache spreads for a new week
   * Only caches on Wednesday when new week becomes available, or immediately if no cache exists
   */
  private async checkAndSyncNewWeek(): Promise<void> {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 3 = Wednesday
      const hour = now.getHours();

      console.log(`🔄 Game sync check: ${now.toISOString()} (Day: ${dayOfWeek}, Hour: ${hour})`);

      // Check if current week needs caching regardless of day (for startup/missed weeks)
      const currentWeekId = getCurrentWeekIdSync();
      const existingGames = await this.prisma.game.findMany({
        where: { weekId: currentWeekId },
        include: {
          lines: {
            where: { source: 'odds-api-wednesday' },
            take: 1
          }
        }
      });

      const gamesWithWednesdayCache = existingGames.filter(g => g.lines.length > 0);

      // If no Wednesday cache exists at all, sync immediately regardless of day
      if (gamesWithWednesdayCache.length === 0) {
        console.log(`🆘 No Wednesday cache found for ${currentWeekId} - syncing immediately`);
        await this.syncNewWeekIfNeeded();
        return;
      }

      // Otherwise, only sync on Wednesday between 8 AM and 6 PM
      if (dayOfWeek === 3 && hour >= 8 && hour <= 18) {
        console.log('📅 Wednesday detected - checking if new week needs caching');
        await this.syncNewWeekIfNeeded();
      } else {
        console.log('⏭️  Not Wednesday sync time and cache exists, skipping');
      }

    } catch (error) {
      console.error('❌ Error in game sync scheduler:', error);
    }
  }

  /**
   * Check if current week needs game caching and sync if needed
   */
  private async syncNewWeekIfNeeded(): Promise<void> {
    const currentWeekId = getCurrentWeekIdSync();
    console.log(`🎯 Checking if ${currentWeekId} needs game caching`);

    // Check if this week already has cached games
    const existingGames = await this.prisma.game.findMany({
      where: { weekId: currentWeekId },
      include: {
        lines: {
          where: { source: 'odds-api-wednesday' }, // Special source for Wednesday cache
          take: 1
        }
      }
    });

    const gamesWithWednesdayCache = existingGames.filter(g => g.lines.length > 0);

    if (gamesWithWednesdayCache.length > 0) {
      console.log(`✅ ${currentWeekId} already has ${gamesWithWednesdayCache.length} cached games, skipping`);
      return;
    }

    console.log(`🆕 ${currentWeekId} needs game caching - starting sync`);
    await this.syncCurrentWeekGames(currentWeekId);
  }

  /**
   * Sync games and cache Wednesday spreads for the current week
   */
  private async syncCurrentWeekGames(weekId: string): Promise<void> {
    try {
      const apiKey = process.env.VITE_ODDS_API_KEY || "5aa0a3d280740ab65185d78b950d7c02";
      const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?apiKey=${apiKey}&regions=us&markets=spreads`;

      console.log('📡 Fetching fresh games and spreads from Odds API...');
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const apiGames = await response.json();
      console.log(`📊 Found ${apiGames.length} games from API for Wednesday caching`);

      if (apiGames.length === 0) {
        console.log('⚠️ No games found from API');
        return;
      }

      let cachedCount = 0;

      for (const apiGame of apiGames) {
        // Calculate which week this game belongs to
        const gameDate = new Date(apiGame.commence_time);
        const { getWeekIdFromDate } = await import('../utils/weekUtils');
        const gameWeekId = getWeekIdFromDate(gameDate);

        // Only cache games for the current week (the week we're displaying)
        if (gameWeekId !== weekId) {
          continue;
        }

        // Create or update game record
        await this.prisma.game.upsert({
          where: { id: apiGame.id },
          update: {
            startAtUtc: gameDate,
            weekId: gameWeekId,
            homeTeam: apiGame.home_team,
            awayTeam: apiGame.away_team,
          },
          create: {
            id: apiGame.id,
            startAtUtc: gameDate,
            weekId: gameWeekId,
            homeTeam: apiGame.home_team,
            awayTeam: apiGame.away_team,
            homeScore: null,
            awayScore: null,
            completed: false
          }
        });

        // Extract and cache Wednesday spread
        let spread = 0;
        if (apiGame.bookmakers && apiGame.bookmakers.length > 0) {
          for (const bookmaker of apiGame.bookmakers) {
            const spreadMarket = bookmaker.markets?.find(market => market.key === 'spreads');
            if (spreadMarket) {
              const homeOutcome = spreadMarket.outcomes?.find(outcome => outcome.name === apiGame.home_team);
              if (homeOutcome && homeOutcome.point !== undefined) {
                spread = homeOutcome.point;
                break;
              }
            }
          }
        }

        // Ensure .5 spreads
        if (spread % 1 === 0) {
          spread += 0.5;
        }

        // Cache the Wednesday spread with special source
        await this.prisma.gameLine.create({
          data: {
            gameId: apiGame.id,
            spread: spread,
            source: 'odds-api-wednesday', // Special Wednesday cache source
            fetchedAtUtc: new Date()
          }
        });

        console.log(`📌 Cached Wednesday spread for ${apiGame.away_team} @ ${apiGame.home_team}: ${spread}`);
        cachedCount++;
      }

      console.log(`✅ Wednesday caching complete! Cached spreads for ${cachedCount} games in ${weekId}`);

    } catch (error) {
      console.error('❌ Error syncing current week games:', error);
    }
  }

  /**
   * Get the cached Wednesday spread for a game
   */
  async getWednesdaySpread(gameId: string): Promise<number | null> {
    const line = await this.prisma.gameLine.findFirst({
      where: {
        gameId: gameId,
        source: 'odds-api-wednesday'
      },
      orderBy: { fetchedAtUtc: 'desc' }
    });

    return line?.spread || null;
  }

  /**
   * Stop the sync scheduler
   */
  stopGameSyncScheduler(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️  Game sync scheduler stopped');
    }
  }
}