import { PrismaClient } from "@prisma/client";
import {
  getCurrentWeekIdSync,
  getDublinDayOfWeek,
  getDublinHour,
} from "../utils/weekUtils";

/**
 * Game Sync Service - Caches spreads on Friday 5 AM when picks open
 */
export class GameSyncService {
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Start the automatic game sync scheduler
   * Runs every hour and caches spreads on Friday 5 AM Dublin time
   */
  startGameSyncScheduler(): NodeJS.Timeout {
    console.log(
      "Starting game sync scheduler (every 1 hour) - Dublin timezone"
    );

    this.syncInterval = setInterval(async () => {
      await this.checkAndCacheSpreads();
    }, 60 * 60 * 1000); // Every hour

    // Also run immediately on startup
    setTimeout(() => {
      this.checkAndCacheSpreads();
    }, 5000);

    return this.syncInterval;
  }

  /**
   * Check if we need to cache spreads
   * Caches on Friday 5 AM Dublin time when picks open, or immediately if no cache exists
   */
  private async checkAndCacheSpreads(): Promise<void> {
    try {
      const dayOfWeek = getDublinDayOfWeek(); // 0 = Sunday, 5 = Friday
      const hour = getDublinHour();

      console.log(
        `Game sync check: Dublin time (Day: ${dayOfWeek}, Hour: ${hour})`
      );

      const currentWeekId = getCurrentWeekIdSync();

      // Check if current week has cached spreads
      const existingCache = await this.prisma.gameLine.findFirst({
        where: {
          game: { weekId: currentWeekId },
          source: "odds-api-friday",
        },
      });

      // If no cache exists, sync immediately (for startup or missed Friday)
      if (!existingCache) {
        console.log(
          `No Friday cache found for ${currentWeekId} - syncing immediately`
        );
        await this.cacheWeekSpreads(currentWeekId);
        return;
      }

      // Otherwise, only sync on Friday at 5 AM (Dublin time)
      if (dayOfWeek === 5 && hour === 5) {
        console.log(
          `Friday 5 AM Dublin time - caching spreads for ${currentWeekId}`
        );
        await this.cacheWeekSpreads(currentWeekId);
      } else {
        console.log("Not Friday 5 AM Dublin time and cache exists, skipping");
      }
    } catch (error) {
      console.error("Error in game sync scheduler:", error);
    }
  }

  /**
   * Cache spreads for the current week (called on Friday 5 AM)
   */
  private async cacheWeekSpreads(weekId: string): Promise<void> {
    try {
      // Check if already cached
      const existingGames = await this.prisma.game.findMany({
        where: { weekId },
        include: {
          lines: {
            where: { source: "odds-api-friday" },
            take: 1,
          },
        },
      });

      const gamesWithCache = existingGames.filter((g) => g.lines.length > 0);

      if (gamesWithCache.length > 0) {
        console.log(
          `${weekId} already has ${gamesWithCache.length} cached games, skipping`
        );
        return;
      }

      console.log(`${weekId} needs spread caching - fetching from API`);

      const apiKey =
        process.env.VITE_ODDS_API_KEY || "5aa0a3d280740ab65185d78b950d7c02";
      const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?apiKey=${apiKey}&regions=us&markets=spreads`;

      console.log("Fetching fresh games and spreads from Odds API...");
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const apiGames = await response.json();
      console.log(`Found ${apiGames.length} games from API`);

      if (apiGames.length === 0) {
        console.log("No games found from API");
        return;
      }

      let cachedCount = 0;

      for (const apiGame of apiGames) {
        const gameDate = new Date(apiGame.commence_time);
        const { getWeekIdFromDate } = await import("../utils/weekUtils");
        const gameWeekId = getWeekIdFromDate(gameDate);

        // Only cache games for the target week
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
            completed: false,
          },
        });

        // Extract spread from bookmakers
        let spread = 0;
        if (apiGame.bookmakers && apiGame.bookmakers.length > 0) {
          for (const bookmaker of apiGame.bookmakers) {
            const spreadMarket = bookmaker.markets?.find(
              (market) => market.key === "spreads"
            );
            if (spreadMarket) {
              const homeOutcome = spreadMarket.outcomes?.find(
                (outcome) => outcome.name === apiGame.home_team
              );
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

        // Cache the Friday 5 AM spread
        await this.prisma.gameLine.create({
          data: {
            gameId: apiGame.id,
            spread: spread,
            source: "odds-api-friday", // Friday cache source
            fetchedAtUtc: new Date(),
          },
        });

        console.log(
          `Cached Friday spread for ${apiGame.away_team} @ ${apiGame.home_team}: ${spread}`
        );
        cachedCount++;
      }

      console.log(
        `Friday caching complete! Cached spreads for ${cachedCount} games in ${weekId}`
      );
    } catch (error) {
      console.error("Error caching week spreads:", error);
    }
  }

  /**
   * Get the cached Friday spread for a game
   */
  async getFridaySpread(gameId: string): Promise<number | null> {
    const line = await this.prisma.gameLine.findFirst({
      where: {
        gameId: gameId,
        source: "odds-api-friday",
      },
      orderBy: { fetchedAtUtc: "desc" },
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
      console.log("Game sync scheduler stopped");
    }
  }
}
