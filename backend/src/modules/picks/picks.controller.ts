import type { FastifyReply, FastifyRequest } from 'fastify';
import type { SubmitPicksDto } from './picks.dto';
import { PickService } from './picks.service';

/**
 * Picks module HTTP handlers.
 */
export class PickController {
  constructor(private readonly service: PickService) {}

  async submit(
    req: FastifyRequest<{
      Body: SubmitPicksDto;
      Headers: { 'idempotency-key'?: string };
    }>,
    reply: FastifyReply,
  ) {
    const userId = req.currentUser!.id;
    const idempotencyKey = req.headers['idempotency-key'];
    const result = await this.service.submitWeeklyPicks(
      req.body,
      userId,
      idempotencyKey,
    );
    return reply.code(201).send(result);
  }

  async deletePicks(
    req: FastifyRequest<{
      Querystring: { weekId: string };
    }>,
    reply: FastifyReply,
  ) {
    const userId = req.currentUser!.id;
    const { weekId } = req.query;
    
    const deleted = await this.service.deleteUserPicks(userId, weekId);
    
    if (!deleted) {
      return reply.code(404).send({
        type: 'https://errors.game-squad-zone/picks-not-found',
        title: 'No picks found for this week',
        status: 404,
      });
    }
    
    return reply.code(200).send({ message: 'Picks deleted successfully' });
  }
}