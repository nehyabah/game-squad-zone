import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateGames14And15() {
  console.log('🔄 Updating games week3-14 and week3-15...\n');

  try {
    const gameUpdates = [
      {
        id: 'week3-14',
        homeTeam: 'Atlanta Falcons',
        awayTeam: 'Carolina Panthers',
        spread: -5.5
      },
      {
        id: 'week3-15',
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'Chicago Bears',
        spread: -1.5
      }
    ];

    for (const gameData of gameUpdates) {
      console.log(`🔄 Updating ${gameData.id}:`);
      console.log(`   To: ${gameData.awayTeam} @ ${gameData.homeTeam}`);

      // Update game
      await prisma.game.update({
        where: { id: gameData.id },
        data: {
          homeTeam: gameData.homeTeam,
          awayTeam: gameData.awayTeam,
          startAtUtc: new Date('2025-09-21T18:00:00Z')
        }
      });

      // Check if game line exists
      const existingLine = await prisma.gameLine.findFirst({
        where: { gameId: gameData.id }
      });

      if (existingLine) {
        // Update existing line
        await prisma.gameLine.update({
          where: {
            gameId_source_fetchedAtUtc: {
              gameId: existingLine.gameId,
              source: existingLine.source,
              fetchedAtUtc: existingLine.fetchedAtUtc
            }
          },
          data: {
            spread: gameData.spread,
            fetchedAtUtc: new Date()
          }
        });
      } else {
        // Create new line
        await prisma.gameLine.create({
          data: {
            gameId: gameData.id,
            spread: gameData.spread,
            source: 'manual',
            fetchedAtUtc: new Date()
          }
        });
      }

      console.log(`   ✅ Updated with spread: ${gameData.spread}`);
    }

    console.log('\n🎯 Games updated successfully!');

  } catch (error) {
    console.error('❌ Error updating games:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateGames14And15().catch(console.error);