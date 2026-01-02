import type { SubmitPicksDto } from "./picks.dto";
import { PickRepo, type PickSetRecord } from "./picks.repo";
import { GameRepo } from "../games/games.repo";
import { GameLineRepo } from "../games/game-lines.repo";
import { AppError } from "../../core/errors";
import { PickLockingService } from "../../services/pick-locking.service";

/**
 * Picks module business logic.
 */
export class GameWeekMismatchError extends AppError {
  constructor() {
    super("All picks must be from the same week");
  }
}

export class PicksLockedError extends AppError {
  constructor() {
    super("Cannot submit picks - deadline has passed (Saturday 12 PM)");
  }
}

export class PicksAlreadyLockedError extends AppError {
  constructor() {
    super("Picks for this week have already been locked");
  }
}

export class InvalidPickCountError extends AppError {
  constructor() {
    super("Must submit exactly 3 picks");
  }
}

export class PickService {
  private readonly cache = new Map<string, PickSetRecord>();
  private readonly pickLockingService: PickLockingService;

  constructor(
    private readonly pickRepo: PickRepo,
    private readonly gameRepo: GameRepo,
    private readonly gameLineRepo: GameLineRepo,
    prisma: any // PrismaClient instance
  ) {
    this.pickLockingService = new PickLockingService(prisma);
  }

  async submitWeeklyPicks(
    data: SubmitPicksDto,
    userId: string,
    idempotencyKey?: string
  ): Promise<PickSetRecord> {
    // Check idempotency
    if (idempotencyKey) {
      const cached = this.cache.get(`idem:${idempotencyKey}`);
      if (cached) return cached;
    }

    // Validate exactly 3 picks
    if (data.picks.length !== 3) {
      throw new InvalidPickCountError();
    }

    // Check if picks are locked (Saturday 12 PM deadline)
    const arePicksLocked =
      await this.pickLockingService.arePicksLockedForCurrentWeek();
    if (arePicksLocked) {
      throw new PicksLockedError();
    }

    // Validate all games are from the same week
    const gameIds = data.picks.map((p) => p.gameId);
    const games = await this.gameRepo.findByIds(gameIds);

    for (const game of games) {
      if (game.weekId !== data.weekId) {
        throw new GameWeekMismatchError();
      }
      // Note: Individual game start times no longer matter - only Saturday 12 PM deadline
    }

    // Check for existing PickSet (one per user per week, no squadId)
    let pickSet = await this.pickRepo.findByUserWeek(userId, data.weekId);

    if (pickSet?.status === "locked") {
      throw new PicksAlreadyLockedError();
    }

    // Create or update PickSet
    if (!pickSet) {
      pickSet = await this.pickRepo.createPickSet({
        userId,
        weekId: data.weekId,
        status: "submitted",
        tiebreakerScore: data.tiebreakerScore,
      });
    } else {
      // Update existing pickSet with new tiebreaker if provided
      if (data.tiebreakerScore !== undefined) {
        pickSet = await this.pickRepo.updatePickSet(pickSet.id, {
          tiebreakerScore: data.tiebreakerScore,
        });
      }
    }

    // Upsert picks with spread snapshot from frontend
    for (const pick of data.picks) {
      const line = await this.gameLineRepo.getLatest(pick.gameId);

      if (!line) {
        throw new AppError(`No line found for game ${pick.gameId}`);
      }

      // Use the spread sent from frontend (what user actually clicked)
      // If not provided, fall back to calculating it from line.spread
      const spreadToStore =
        pick.spreadAtPick !== undefined
          ? pick.spreadAtPick
          : pick.selection === "away"
          ? -line.spread
          : line.spread;

      console.log("Saving pick:", {
        gameId: pick.gameId,
        selection: pick.selection,
        lineSpread: line.spread,
        frontendSpread: pick.spreadAtPick,
        storingSpread: spreadToStore,
      });

      await this.pickRepo.upsertPick({
        pickSetId: pickSet.id,
        gameId: pick.gameId,
        choice: pick.selection,
        spreadAtPick: spreadToStore,
        lineSource: line.source,
      });
    }

    // Cache for idempotency (24 hour TTL would be better with Redis)
    if (idempotencyKey) {
      this.cache.set(`idem:${idempotencyKey}`, pickSet);
      // TODO: Add TTL when using Redis
      // setTimeout(() => this.cache.delete(`idem:${idempotencyKey}`), 86400000);
    }

    return pickSet;
  }

  async getUserPicks(
    userId: string,
    weekId: string,
    sport?: string
  ): Promise<PickSetRecord | null> {
    return this.pickRepo.findByUserWeek(userId, weekId, sport);
  }

  async getUserPickHistory(userId: string, sport?: string): Promise<PickSetRecord[]> {
    return this.pickRepo.findAllByUser(userId, sport);
  }

  async deleteUserPicks(userId: string, weekId: string, sport?: string): Promise<boolean> {
    const pickSet = await this.pickRepo.findByUserWeek(userId, weekId, sport);

    if (!pickSet) {
      return false; // No picks found to delete
    }

    // Delete all picks associated with this pick set
    await this.pickRepo.deletePicks(pickSet.id);

    // Delete the pick set itself
    await this.pickRepo.deletePickSet(pickSet.id);

    return true;
  }
}
