import type { CreateSquadDto } from './squads.dto';
import { SquadService } from './squads.service';

/**
 * Squads module HTTP handlers.
 */
export class SquadController {
  constructor(private readonly service: SquadService) {}

  async create(_body: CreateSquadDto) {
    // TODO: handle create squad
  }
}
