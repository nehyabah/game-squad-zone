import type { FastifyReply, FastifyRequest } from 'fastify';
import type { SubmitPicksInput } from './picks.dto';
import { PickService } from './picks.service';

/**
 * Picks module HTTP handlers.
 */
export class PickController {
  constructor(private readonly service: PickService) {}

  async submit(
    req: FastifyRequest<{
      Body: SubmitPicksInput;
      Headers: { 'idempotency-key'?: string };
    }>,
    reply: FastifyReply,
  ) {
    const userId = (req as { user?: { id?: string } }).user?.id ?? '';
    const idempotencyKey = req.headers['idempotency-key'];
    const result = await this.service.submitWeeklyPicks(
      req.body,
      userId,
      idempotencyKey,
    );
    return reply.code(201).send(result);
  }
}