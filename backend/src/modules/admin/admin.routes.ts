import { FastifyInstance } from 'fastify';
import { AutoScoringService } from '../../services/auto-scoring.service';

async function adminRoutes(app: FastifyInstance) {
  // Manual trigger for auto-scoring (for testing/admin)
  app.post('/admin/score-completed-games', async (request, reply) => {
    try {
      const autoScoring = new AutoScoringService(app.prisma);
      await autoScoring.processCompletedGames();
      
      reply.send({ 
        success: true, 
        message: 'Completed games have been scored' 
      });
    } catch (error) {
      app.log.error('Error in manual scoring:', error);
      reply.status(500).send({ 
        success: false, 
        error: 'Failed to score completed games' 
      });
    }
  });

  // Simulate game completion for testing
  app.post('/admin/simulate-game-completion', async (request, reply) => {
    try {
      const { gameId, homeScore, awayScore } = request.body as {
        gameId: string;
        homeScore: number;
        awayScore: number;
      };

      if (!gameId || homeScore === undefined || awayScore === undefined) {
        return reply.status(400).send({
          success: false,
          error: 'gameId, homeScore, and awayScore are required'
        });
      }

      const autoScoring = new AutoScoringService(app.prisma);
      await autoScoring.simulateGameCompletion(gameId, homeScore, awayScore);

      reply.send({
        success: true,
        message: `Game ${gameId} completed with score ${awayScore}-${homeScore} and picks scored`
      });
    } catch (error) {
      app.log.error('Error simulating game completion:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to simulate game completion'
      });
    }
  });

  // Check auto-scoring status
  app.get('/admin/scoring-status', async (request, reply) => {
    try {
      // Get games with pending picks
      const pendingGames = await app.prisma.game.findMany({
        where: {
          picks: {
            some: {
              status: 'pending'
            }
          }
        },
        include: {
          _count: {
            select: {
              picks: {
                where: { status: 'pending' }
              }
            }
          }
        }
      });

      // Get completed games
      const completedGames = await app.prisma.game.findMany({
        where: { completed: true },
        include: {
          _count: {
            select: {
              picks: true
            }
          }
        }
      });

      reply.send({
        success: true,
        data: {
          pendingGames: pendingGames.length,
          completedGames: completedGames.length,
          gamesWithPendingPicks: pendingGames.map(game => ({
            id: game.id,
            matchup: `${game.awayTeam} @ ${game.homeTeam}`,
            completed: game.completed,
            pendingPicksCount: game._count.picks
          }))
        }
      });
    } catch (error) {
      app.log.error('Error checking scoring status:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to check scoring status'
      });
    }
  });
}

export default adminRoutes;