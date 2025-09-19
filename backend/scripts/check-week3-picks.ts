import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWeek3Picks() {
  console.log('🔍 Checking Week 3 picks...\n');

  try {
    const week3Picks = await prisma.pick.findMany({
      where: {
        game: { weekId: '2025-W3' }
      },
      include: {
        game: true,
        pickSet: {
          include: { user: true }
        }
      }
    });

    console.log(`Found ${week3Picks.length} Week 3 picks:`);

    week3Picks.forEach((pick) => {
      console.log(`- User: ${pick.pickSet.user.displayName || pick.pickSet.user.username}`);
      console.log(`  Game: ${pick.game.awayTeam} @ ${pick.game.homeTeam} (${pick.game.id})`);
      console.log(`  Choice: ${pick.choice}`);
      console.log('');
    });

    // Also check picksets for Week 3
    const week3PickSets = await prisma.pickSet.findMany({
      where: { weekId: '2025-W3' },
      include: { user: true }
    });

    console.log(`Found ${week3PickSets.length} Week 3 pick sets from users:`);
    week3PickSets.forEach((ps) => {
      console.log(`- ${ps.user.displayName || ps.user.username}`);
    });

  } catch (error) {
    console.error('❌ Error checking picks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWeek3Picks().catch(console.error);