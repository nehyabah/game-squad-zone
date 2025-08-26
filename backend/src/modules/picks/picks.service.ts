import type { SubmitPicksInput } from './picks.dto';
import { PickRepo, type PickSetRecord } from './picks.repo';
import { GameRepo } from '../games/games.repo';
import { GameLineRepo } from '../games/game-lines.repo';

/**
 * Picks module business logic.
 */
export class PickService {
  private readonly cache = new Map<string, PickSetRecord>();

  constructor(
    private readonly pickRepo: PickRepo,
    private readonly gameRepo: GameRepo,
    private readonly gameLineRepo: GameLineRepo,
  ) {}

  async submitWeeklyPicks(
    data: SubmitPicksInput,
    userId: string,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const cached = this.cache.get(idempotencyKey);
      if (cached) return cached;
    }

    const gameIds = data.picks.map((p) => p.gameId);
    const games = await this.gameRepo.findByIds(gameIds);

    for (const game of games) {
      if (game.weekId !== data.weekId) {
        throw new Error('GameWeekMismatchError');
      }
      if (new Date() >= game.startAtUtc) {
        throw new Error('PicksLockedError');
      }
    }

    let pickSet = await this.pickRepo.findByUserWeekSquad(
      userId,
      data.weekId,
      data.squadId,
    );

    if (pickSet?.status === 'locked') {
      throw new Error('PicksAlreadyLockedError');
    }

    if (!pickSet) {
      pickSet = await this.pickRepo.createPickSet({
        userId,
        squadId: data.squadId,
        weekId: data.weekId,
        status: 'submitted',
        tiebreakerScore: data.tiebreakerScore,
      });
    }

    for (const pick of data.picks) {
      const line = await this.gameLineRepo.getLatest(pick.gameId);
      await this.pickRepo.upsertPick({
        pickSetId: pickSet.id,
        gameId: pick.gameId,
        choice: pick.selection,
        spreadAtPick: line.spread,
        lineSource: line.source,
      });
    }

    if (idempotencyKey) {
      this.cache.set(idempotencyKey, pickSet);
    }

    return pickSet;
  }
}

