import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMissingGames() {
  console.log('🏈 Adding missing Week 3 games...\n');

  try {
    const newGames = [
      {
        id: 'week3-14',
        homeTeam: 'Atlanta Falcons',
        awayTeam: 'Carolina Panthers',
        spread: -5.5,
        startAtUtc: new Date('2025-09-21T18:00:00Z')
      },
      {
        id: 'week3-15',
        homeTeam: 'Dallas Cowboys',
        awayTeam: 'Chicago Bears',
        spread: -1.5,
        startAtUtc: new Date('2025-09-21T18:00:00Z')
      }
    ];

    for (const gameData of newGames) {
      // Check if game already exists
      const existingGame = await prisma.game.findFirst({
        where: { id: gameData.id }
      });

      if (existingGame) {
        console.log(`✅ Game ${gameData.id} already exists - skipping`);
        continue;
      }

      console.log(`🆕 Creating game: ${gameData.awayTeam} @ ${gameData.homeTeam} (${gameData.id})`);

      // Create game
      await prisma.game.create({
        data: {
          id: gameData.id,
          startAtUtc: gameData.startAtUtc,
          weekId: '2025-W3',
          homeTeam: gameData.homeTeam,
          awayTeam: gameData.awayTeam,
          homeScore: null,
          awayScore: null,
          completed: false
        }
      });

      // Create game line
      await prisma.gameLine.create({
        data: {
          gameId: gameData.id,
          spread: gameData.spread,
          source: 'manual',
          fetchedAtUtc: new Date()
        }
      });

      console.log(`   ✅ Added with spread: ${gameData.spread}`);
    }

    // Count total Week 3 games
    const week3Count = await prisma.game.count({
      where: { weekId: '2025-W3' }
    });

    console.log(`\n🎯 Week 3 now has ${week3Count} total games`);

  } catch (error) {
    console.error('❌ Error adding games:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingGames().catch(console.error);