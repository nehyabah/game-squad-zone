import type { FastifyInstance } from 'fastify';
import { StatsRepo } from './stats.repo';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { ScoringService } from '../scoring/scoring.service';
import { LeaderboardRepo } from '../leaderboards/leaderboards.repo';
import type { PersonalStatsQueryDto, SquadStatsQueryDto, MemberComparisonQueryDto } from './stats.dto';

/**
 * Statistics module route registration.
 */
export default async function statsRoutes(app: FastifyInstance) {
  const scoringService = new ScoringService(app.prisma);
  const leaderboardRepo = new LeaderboardRepo(app.prisma, scoringService);
  const repo = new StatsRepo(app.prisma, leaderboardRepo);
  const service = new StatsService(repo);
  const controller = new StatsController(service);

  // Get personal statistics
  app.get('/stats/personal/:userId', { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const params = req.params as { userId: string };
      const query = req.query as { squadId?: string };

      const queryDto: PersonalStatsQueryDto = {
        userId: params.userId,
        squadId: query.squadId,
      };

      const data = await controller.getPersonalStats(queryDto);
      return reply.send(data);
    } catch (error) {
      console.error('Error fetching personal stats:', error);
      return reply.status(500).send({ error: 'Failed to fetch personal statistics' });
    }
  });

  // Get squad statistics
  app.get('/stats/squad/:squadId', { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const params = req.params as { squadId: string };

      const queryDto: SquadStatsQueryDto = {
        squadId: params.squadId,
      };

      const data = await controller.getSquadStats(queryDto);
      return reply.send(data);
    } catch (error) {
      console.error('Error fetching squad stats:', error);
      return reply.status(500).send({ error: 'Failed to fetch squad statistics' });
    }
  });

  // Get member comparison
  app.get('/stats/comparison', { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const query = req.query as { member1Id: string; member2Id: string; squadId: string };

      if (!query.member1Id || !query.member2Id || !query.squadId) {
        return reply.status(400).send({
          error: 'Missing required parameters: member1Id, member2Id, and squadId are required'
        });
      }

      const queryDto: MemberComparisonQueryDto = {
        member1Id: query.member1Id,
        member2Id: query.member2Id,
        squadId: query.squadId,
      };

      const data = await controller.getMemberComparison(queryDto);
      return reply.send(data);
    } catch (error) {
      console.error('Error fetching member comparison:', error);
      return reply.status(500).send({ error: 'Failed to fetch member comparison' });
    }
  });
}
