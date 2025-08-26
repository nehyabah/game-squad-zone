import type { CreatePickDto } from './picks.dto';
import { PickService } from './picks.service';

/**
 * Picks module HTTP handlers.
 */
export class PickController {
  constructor(private readonly service: PickService) {}

  async create(_body: CreatePickDto) {
    // TODO: handle create pick
  }
}
