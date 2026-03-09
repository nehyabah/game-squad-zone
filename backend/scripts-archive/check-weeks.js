const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkWeeks() {
  console.log('🔍 Checking all weeks in database...\n');

  try {
    // Find all unique weekIds
    const allGames = await prisma.game.findMany({
      select: {
        weekId: true,
        id: true,
        awayTeam: true,
        homeTeam: true,
        completed: true,
        homeScore: true,
        awayScore: true
      },
      orderBy: {
        weekId: 'asc'
      }
    });

    const weekCounts = {};
    allGames.forEach(game => {
      if (!weekCounts[game.weekId]) {
        weekCounts[game.weekId] = {
          total: 0,
          completed: 0,
          withScores: 0
        };
      }
      weekCounts[game.weekId].total++;
      if (game.completed) weekCounts[game.weekId].completed++;
      if (game.homeScore !== null || game.awayScore !== null) weekCounts[game.weekId].withScores++;
    });

    console.log('📊 Week summary:');
    Object.keys(weekCounts).forEach(weekId => {
      const stats = weekCounts[weekId];
      console.log(`  Week ${weekId}: ${stats.total} games, ${stats.completed} completed, ${stats.withScores} with scores`);
    });

    // Show some sample games for each week
    console.log('\n🏈 Sample games by week:');
    Object.keys(weekCounts).forEach(weekId => {
      console.log(`\n--- Week ${weekId} ---`);
      const weekGames = allGames.filter(g => g.weekId === weekId).slice(0, 3);
      weekGames.forEach(game => {
        console.log(`  ${game.id}: ${game.awayTeam} @ ${game.homeTeam} (completed: ${game.completed}, scores: ${game.awayScore || 'N/A'}-${game.homeScore || 'N/A'})`);
      });
      if (allGames.filter(g => g.weekId === weekId).length > 3) {
        console.log(`  ... and ${allGames.filter(g => g.weekId === weekId).length - 3} more`);
      }
    });

    // Check pick sets by week
    console.log('\n🎯 Pick sets by week:');
    const allPickSets = await prisma.pickSet.findMany({
      select: {
        weekId: true,
        id: true,
        userId: true
      }
    });

    const pickSetCounts = {};
    allPickSets.forEach(pickSet => {
      if (!pickSetCounts[pickSet.weekId]) {
        pickSetCounts[pickSet.weekId] = 0;
      }
      pickSetCounts[pickSet.weekId]++;
    });

    Object.keys(pickSetCounts).forEach(weekId => {
      console.log(`  Week ${weekId}: ${pickSetCounts[weekId]} pick sets`);
    });

  } catch (error) {
    console.error('❌ Error checking weeks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWeeks();