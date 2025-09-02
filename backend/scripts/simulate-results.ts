/**
 * Simulate game results for testing
 * This script adds fake scores to existing games for testing purposes
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simulateGameResults() {
  try {
    console.log('🎲 Simulating game results for testing...');

    // Get some games from the current week to simulate
    const games = await prisma.game.findMany({
      where: {
        weekId: '2025-W1',
        completed: false
      },
      take: 5,
      include: {
        picks: {
          include: {
            pickSet: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    console.log(`🏈 Found ${games.length} games to simulate results for`);

    if (games.length === 0) {
      console.log('ℹ️  No games found for simulation');
      return;
    }

    // Simulate results for each game
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      
      // Generate random scores (realistic NFL scores)
      const homeScore = Math.floor(Math.random() * 21) + 14; // 14-34 points
      const awayScore = Math.floor(Math.random() * 21) + 14; // 14-34 points
      
      // Update the game with simulated results
      await prisma.game.update({
        where: { id: game.id },
        data: {
          homeScore,
          awayScore,
          completed: true
        }
      });

      console.log(`✅ ${game.homeTeam} ${homeScore} - ${awayScore} ${game.awayTeam} (${game.picks.length} picks)`);
    }

    console.log(`\n🎯 Simulated results for ${games.length} games!`);
    console.log('Now run: npm run process-results');

  } catch (error) {
    console.error('❌ Error simulating game results:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
simulateGameResults();