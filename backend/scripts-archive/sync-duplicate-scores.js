const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncDuplicateScores() {
  console.log('🔄 Syncing scores for duplicate Week 3 games...\n');

  try {
    // Get all Week 3 games
    const allGames = await prisma.game.findMany({
      where: { weekId: '2025-W3' },
      orderBy: { id: 'asc' }
    });

    const completedGames = allGames.filter(g => g.completed);
    const pendingGames = allGames.filter(g => !g.completed);

    console.log(`📊 Found ${completedGames.length} completed games and ${pendingGames.length} pending games`);

    let synced = 0;

    // For each pending game, try to find a completed counterpart
    for (const pendingGame of pendingGames) {
      const matchingCompleted = completedGames.find(completedGame => {
        // Check if teams match (in either orientation)
        const match1 =
          pendingGame.homeTeam === completedGame.awayTeam &&
          pendingGame.awayTeam === completedGame.homeTeam;

        const match2 =
          pendingGame.homeTeam === completedGame.homeTeam &&
          pendingGame.awayTeam === completedGame.awayTeam;

        return match1 || match2;
      });

      if (matchingCompleted) {
        let homeScore, awayScore;

        // Determine correct score assignment
        if (pendingGame.homeTeam === matchingCompleted.homeTeam) {
          // Same orientation
          homeScore = matchingCompleted.homeScore;
          awayScore = matchingCompleted.awayScore;
        } else {
          // Swapped orientation
          homeScore = matchingCompleted.awayScore;
          awayScore = matchingCompleted.homeScore;
        }

        console.log(`🔄 ${pendingGame.awayTeam} @ ${pendingGame.homeTeam}: ${awayScore} - ${homeScore}`);
        console.log(`   (from: ${matchingCompleted.awayTeam} @ ${matchingCompleted.homeTeam}: ${matchingCompleted.awayScore} - ${matchingCompleted.homeScore})`);

        await prisma.game.update({
          where: { id: pendingGame.id },
          data: {
            awayScore: awayScore,
            homeScore: homeScore,
            completed: true
          }
        });

        console.log(`   ✅ Synced\n`);
        synced++;
      } else {
        console.log(`❓ No match found for: ${pendingGame.awayTeam} @ ${pendingGame.homeTeam}`);
      }
    }

    console.log(`\n📊 Sync Summary:`);
    console.log(`  ✅ Successfully synced: ${synced} games`);

    // Final check
    const finalPending = await prisma.game.count({
      where: {
        weekId: '2025-W3',
        completed: false
      }
    });

    const finalCompleted = await prisma.game.count({
      where: {
        weekId: '2025-W3',
        completed: true
      }
    });

    console.log(`\n🔍 Final Week 3 Status:`);
    console.log(`  - Completed games: ${finalCompleted}`);
    console.log(`  - Still pending: ${finalPending}`);

    if (finalPending === 0) {
      console.log('🎉 All Week 3 games now have scores!');
    }

    // Verify picks remain untouched
    const picks = await prisma.pick.findMany({
      where: {
        game: { weekId: '2025-W3' }
      }
    });

    const picksWithResults = picks.filter(p => p.result && p.result !== 'pending');
    console.log(`\n🎯 Pick Status Check:`);
    console.log(`  - Total picks: ${picks.length}`);
    console.log(`  - Picks with results: ${picksWithResults.length} (should remain 0)`);

    if (picksWithResults.length === 0) {
      console.log('✅ SUCCESS: All scores synced, picks still pending for spread calculations');
    }

  } catch (error) {
    console.error('❌ Error syncing scores:', error);
    throw error;
  }
}

async function main() {
  console.log('🏈 Syncing Duplicate Week 3 Game Scores\n');

  try {
    await syncDuplicateScores();
  } catch (error) {
    console.error('💥 Sync failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}