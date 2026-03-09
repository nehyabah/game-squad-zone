import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWeek3Games() {
  console.log('🏈 Checking Week 3 games in database...\n');

  try {
    const week3Games = await prisma.game.findMany({
      where: { weekId: '2025-W3' },
      include: { lines: true },
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${week3Games.length} Week 3 games:\n`);

    week3Games.forEach((game) => {
      const spread = game.lines.length > 0 ? game.lines[0].spread : 'No spread';
      console.log(`ID: ${game.id}`);
      console.log(`  ${game.awayTeam} @ ${game.homeTeam}`);
      console.log(`  Spread: ${spread}`);
      console.log(`  Start: ${game.startAtUtc}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking games:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWeek3Games().catch(console.error);