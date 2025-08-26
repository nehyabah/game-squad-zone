import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { SquadController } from './squads.controller';
import { SquadRepo } from './squads.repo';
import { SquadService } from './squads.service';
import { createSquadSchema, joinSquadSchema } from './squads.schema';

interface FastifyWithPrisma extends FastifyInstance {
  prisma: PrismaClient;
}

/**
 * Squads module route registration.
 */
export function registerSquadRoutes(app: FastifyInstance) {
  const repo = new SquadRepo((app as FastifyWithPrisma).prisma);
  const service = new SquadService(repo);
  const controller = new SquadController(service);

  app.post(
    '/squads',
    { schema: { body: createSquadSchema } },
    (req: FastifyRequest, reply: FastifyReply) => controller.create(req, reply),
  );

  app.post(
    '/squads/join',
    { schema: { body: joinSquadSchema } },
    (req: FastifyRequest, reply: FastifyReply) => controller.join(req, reply),
  );

  app.get(
    '/squads/:id',
    (req: FastifyRequest, reply: FastifyReply) => controller.get(req, reply),
  );

  app.get('/squads/:id/leaderboard', (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.status(501).send({
      type: 'https://errors.game-squad-zone/not-implemented',
      title: 'Not implemented',
      status: 501,
    });
  });
}