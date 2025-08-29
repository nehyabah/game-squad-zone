import { GameService } from './games.service';

/**
 * Games module HTTP handlers.
 */
export class GameController {
  constructor(private readonly service: GameService) {}

  async get(_id: string) {
    // TODO: handle get game
  }
}
