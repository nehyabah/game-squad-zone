import type { CreatePickInput } from './picks.dto';
import { PickRepo } from './picks.repo';

/**
 * Picks module business logic.
 */
export class PickService {
  constructor(private readonly repo: PickRepo) {}

  async create(data: CreatePickInput, userId: string) {
    return this.repo.createPick(userId, data.gameId, data.selection);
  }
}
