import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { PickController } from './picks.controller';
import { PickRepo } from './picks.repo';
import { PickService } from './picks.service';
import { createPickSchema } from './picks.schema';

interface FastifyWithPrisma extends FastifyInstance {
  prisma: PrismaClient;
}

/**
 * Picks module route registration.
 */
export function registerPickRoutes(app: FastifyInstance) {
  const repo = new PickRepo((app as FastifyWithPrisma).prisma);
  const service = new PickService(repo);
  const controller = new PickController(service);

  app.post(
    '/picks',
    { schema: { body: createPickSchema } },
    (req: FastifyRequest, reply: FastifyReply) => controller.create(req, reply),
  );
}
