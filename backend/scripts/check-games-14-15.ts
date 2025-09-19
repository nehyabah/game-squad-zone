import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGames14And15() {
  console.log('🔍 Checking games week3-14 and week3-15...\n');

  try {
    const games = await prisma.game.findMany({
      where: {
        id: { in: ['week3-14', 'week3-15'] }
      },
      include: { lines: true },
      orderBy: { id: 'asc' }
    });

    games.forEach((game) => {
      const spread = game.lines.length > 0 ? game.lines[0].spread : 'No spread';
      console.log(`${game.id}: ${game.awayTeam} @ ${game.homeTeam}`);
      console.log(`   Spread: ${spread}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking games:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGames14And15().catch(console.error);