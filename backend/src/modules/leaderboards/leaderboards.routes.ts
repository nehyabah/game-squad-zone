import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { LeaderboardRepo } from './leaderboards.repo';
import { LeaderboardService } from './leaderboards.service';
import { LeaderboardController } from './leaderboards.controller';
import { ScoringService } from '../scoring/scoring.service';
import { leaderboardQuerySchema } from './leaderboards.schema';
import type { LeaderboardQueryDto } from './leaderboards.dto';

/**
 * Leaderboards module route registration.
 */
export default async function leaderboardRoutes(app: FastifyInstance) {
  const scoringService = new ScoringService(app.prisma);
  const repo = new LeaderboardRepo(app.prisma, scoringService);
  const service = new LeaderboardService(repo);
  const controller = new LeaderboardController(service);

  // Generic leaderboard endpoint
  app.get('/leaderboards', { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const query = req.query as LeaderboardQueryDto;
      const data = await controller.get(query);
      return reply.send(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return reply.status(500).send({ error: 'Failed to fetch leaderboard' });
    }
  });

  // Weekly leaderboard
  app.get('/leaderboards/weekly/:weekId', { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const params = req.params as { weekId: string };
      const query = req.query as { sport?: string };
      const data = await controller.getWeekly(params.weekId, query.sport);
      return reply.send(data);
    } catch (error) {
      console.error('Error fetching weekly leaderboard:', error);
      return reply.status(500).send({ error: 'Failed to fetch weekly leaderboard' });
    }
  });

  // Season leaderboard
  app.get('/leaderboards/season', async (req, reply) => {
    try {
      const query = req.query as { sport?: string };
      const data = await controller.getSeason(query.sport);
      return reply.send(data);
    } catch (error) {
      console.error('Error fetching season leaderboard:', error);
      return reply.status(500).send({ error: 'Failed to fetch season leaderboard' });
    }
  });

  // Squad leaderboard
  app.get('/leaderboards/squad/:squadId', { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const params = req.params as { squadId: string };
      const query = req.query as { weekId?: string };
      const data = await controller.getSquad(params.squadId, query.weekId);
      return reply.send(data);
    } catch (error) {
      console.error('Error fetching squad leaderboard:', error);
      return reply.status(500).send({ error: 'Failed to fetch squad leaderboard' });
    }
  });

  // User rank
  app.get('/leaderboards/rank/:userId', { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const params = req.params as { userId: string };
      const query = req.query as { weekId?: string };
      const data = await controller.getUserRank(params.userId, query.weekId);
      return reply.send(data);
    } catch (error) {
      console.error('Error fetching user rank:', error);
      return reply.status(500).send({ error: 'Failed to fetch user rank' });
    }
  });
}
