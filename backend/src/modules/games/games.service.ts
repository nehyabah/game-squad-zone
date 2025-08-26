import type { GameDto } from './games.dto';

/**
 * Games module business logic.
 */
export class GameService {
  async getGame(_id: string): Promise<GameDto | null> {
    // TODO: get game
    return null;
  }
}
