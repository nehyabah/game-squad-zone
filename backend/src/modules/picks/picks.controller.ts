import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CreatePickInput } from './picks.dto';
import { PickService } from './picks.service';

/**
 * Picks module HTTP handlers.
 */
export class PickController {
  constructor(private readonly service: PickService) {}

  async create(
    req: FastifyRequest<{ Body: CreatePickInput }>,
    reply: FastifyReply,
  ) {
    const userId = (req as { user?: { id?: string } }).user?.id ?? '';
    const pick = await this.service.create(req.body, userId);
    return reply.code(201).send(pick);
  }
}
