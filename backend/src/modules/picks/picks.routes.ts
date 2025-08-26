import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { PickController } from './picks.controller';
import { PickRepo } from './picks.repo';
import { PickService } from './picks.service';
import { submitPicksSchema } from './picks.schema';
import { GameRepo } from '../games/games.repo';
import { GameLineRepo } from '../games/game-lines.repo';

interface FastifyWithPrisma extends FastifyInstance {
  prisma: PrismaClient;
}

/**
 * Picks module route registration.
 */
export function registerPickRoutes(app: FastifyInstance) {
  const prisma = (app as FastifyWithPrisma).prisma;
  const repo = new PickRepo(prisma);
  const gameRepo = new GameRepo(prisma);
  const gameLineRepo = new GameLineRepo(prisma);
  const service = new PickService(repo, gameRepo, gameLineRepo);
  const controller = new PickController(service);

  app.post(
    '/picks',
    { schema: { body: submitPicksSchema } },
    (req: FastifyRequest, reply: FastifyReply) => controller.submit(req, reply),
  );

  // Add GET endpoint to retrieve user's picks for a week
  app.get(
    '/picks/me',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['weekId'],
          properties: {
            weekId: { type: 'string' }
          }
        }
      }
    },
    async (req: FastifyRequest<{ Querystring: { weekId: string } }>, reply: FastifyReply) => {
      const userId = (req as { user?: { id?: string } }).user?.id ?? '';
      const picks = await service.getUserPicks(userId, req.query.weekId);
      if (!picks) {
        return reply.code(404).send({
          type: 'https://errors.game-squad-zone/picks-not-found',
          title: 'No picks found for this week',
          status: 404,
        });
      }
      return reply.send(picks);
    }
  );
}