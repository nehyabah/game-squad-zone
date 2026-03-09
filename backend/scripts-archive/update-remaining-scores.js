const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateRemainingScores() {
  console.log('🎯 Updating remaining Week 3 scores...\n');

  // Scores provided: NYG KC 9-22, BAL DET 30-38
  const remainingScores = [
    // Kansas City vs New York Giants games
    {
      teams: ['Kansas City Chiefs', 'New York Giants'],
      kcScore: 22,
      nygScore: 9
    },
    // Baltimore vs Detroit games
    {
      teams: ['Baltimore Ravens', 'Detroit Lions'],
      balScore: 30,
      detScore: 38
    }
  ];

  try {
    // Get all pending Week 3 games
    const pendingGames = await prisma.game.findMany({
      where: {
        weekId: '2025-W3',
        completed: false
      }
    });

    console.log(`📊 Found ${pendingGames.length} pending games\n`);

    let updated = 0;

    // Update KC vs NYG games
    const kcNygGames = pendingGames.filter(game =>
      (game.homeTeam.includes('Chiefs') && game.awayTeam.includes('Giants')) ||
      (game.homeTeam.includes('Giants') && game.awayTeam.includes('Chiefs'))
    );

    console.log(`🏈 Updating KC vs NYG games (${kcNygGames.length} found):`);
    for (const game of kcNygGames) {
      let homeScore, awayScore;

      if (game.homeTeam.includes('Chiefs')) {
        homeScore = 22; // KC
        awayScore = 9;  // NYG
      } else {
        homeScore = 9;  // NYG
        awayScore = 22; // KC
      }

      console.log(`  🔄 ${game.awayTeam} @ ${game.homeTeam}: ${awayScore} - ${homeScore}`);

      await prisma.game.update({
        where: { id: game.id },
        data: {
          awayScore: awayScore,
          homeScore: homeScore,
          completed: true
        }
      });

      console.log(`  ✅ Updated`);
      updated++;
    }

    // Update BAL vs DET games
    const balDetGames = pendingGames.filter(game =>
      (game.homeTeam.includes('Ravens') && game.awayTeam.includes('Lions')) ||
      (game.homeTeam.includes('Lions') && game.awayTeam.includes('Ravens'))
    );

    console.log(`\n🏈 Updating BAL vs DET games (${balDetGames.length} found):`);
    for (const game of balDetGames) {
      let homeScore, awayScore;

      if (game.homeTeam.includes('Ravens')) {
        homeScore = 30; // BAL
        awayScore = 38; // DET
      } else {
        homeScore = 38; // DET
        awayScore = 30; // BAL
      }

      console.log(`  🔄 ${game.awayTeam} @ ${game.homeTeam}: ${awayScore} - ${homeScore}`);

      await prisma.game.update({
        where: { id: game.id },
        data: {
          awayScore: awayScore,
          homeScore: homeScore,
          completed: true
        }
      });

      console.log(`  ✅ Updated`);
      updated++;
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`  ✅ Successfully updated: ${updated} games`);

    // Final verification
    const stillPending = await prisma.game.count({
      where: {
        weekId: '2025-W3',
        completed: false
      }
    });

    const completed = await prisma.game.count({
      where: {
        weekId: '2025-W3',
        completed: true
      }
    });

    console.log(`\n🔍 Final Status:`);
    console.log(`  - Completed games: ${completed}`);
    console.log(`  - Still pending: ${stillPending}`);

    // Check picks remain untouched
    const picks = await prisma.pick.findMany({
      where: {
        game: { weekId: '2025-W3' }
      }
    });

    const picksWithResults = picks.filter(p => p.result && p.result !== 'pending');
    console.log(`\n🎯 Pick Status:`);
    console.log(`  - Total picks: ${picks.length}`);
    console.log(`  - Picks with results: ${picksWithResults.length} (should be 0)`);

    if (picksWithResults.length === 0) {
      console.log('✅ SUCCESS: All scores updated, pick results still pending');
    }

  } catch (error) {
    console.error('❌ Error updating scores:', error);
    throw error;
  }
}

async function main() {
  console.log('🏈 Updating Remaining Week 3 Scores\n');
  console.log('NYG vs KC: 9-22 (KC wins)');
  console.log('BAL vs DET: 30-38 (DET wins)\n');

  try {
    await updateRemainingScores();
    console.log('\n🎉 All remaining scores updated!');
  } catch (error) {
    console.error('💥 Update failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}