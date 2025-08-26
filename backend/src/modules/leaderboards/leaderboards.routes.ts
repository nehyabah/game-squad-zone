import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { LeaderboardRepo } from './leaderboards.repo';
import { LeaderboardService } from './leaderboards.service';
import { LeaderboardController } from './leaderboards.controller';
import { leaderboardQuerySchema } from './leaderboards.schema';
import type { LeaderboardQueryDto } from './leaderboards.dto';

/**
 * Leaderboards module route registration.
 */
export function registerLeaderboardRoutes(app: FastifyInstance) {
  const repo = new LeaderboardRepo();
  const service = new LeaderboardService(repo);
  const controller = new LeaderboardController(service);

  app.get(
    '/leaderboards',
    { schema: { querystring: leaderboardQuerySchema } },
    async (
      req: FastifyRequest<{ Querystring: LeaderboardQueryDto }>,
      reply: FastifyReply,
    ) => {
      const data = await controller.get(req.query);
      return reply.send(data);
    },
  );
}
