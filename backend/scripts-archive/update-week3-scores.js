const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listWeek3Games() {
  console.log('📋 Listing all Week 3 games for score updates...\n');

  try {
    const week3Games = await prisma.game.findMany({
      where: {
        weekId: '2025-W3'
      },
      orderBy: {
        startAtUtc: 'asc'
      }
    });

    console.log(`🏈 Found ${week3Games.length} Week 3 games:`);
    week3Games.forEach((game, index) => {
      console.log(`${index + 1}. ${game.id}`);
      console.log(`   ${game.awayTeam} @ ${game.homeTeam}`);
      console.log(`   Current scores: ${game.awayScore || 'N/A'} - ${game.homeScore || 'N/A'}`);
      console.log(`   Completed: ${game.completed}`);
      console.log('');
    });

    return week3Games;

  } catch (error) {
    console.error('❌ Error listing games:', error);
    return [];
  }
}

async function updateGameScore(gameId, awayScore, homeScore, markCompleted = true) {
  console.log(`🔄 Updating ${gameId}: ${awayScore} - ${homeScore}`);

  try {
    const updatedGame = await prisma.game.update({
      where: {
        id: gameId
      },
      data: {
        awayScore: parseInt(awayScore),
        homeScore: parseInt(homeScore),
        completed: markCompleted
      }
    });

    console.log(`✅ Updated: ${updatedGame.awayTeam} ${updatedGame.awayScore} - ${updatedGame.homeScore} ${updatedGame.homeTeam}`);
    return updatedGame;

  } catch (error) {
    console.error(`❌ Error updating game ${gameId}:`, error);
    return null;
  }
}

async function updateBulkScores(scoreData) {
  console.log('🎯 Starting bulk score update...\n');

  let updated = 0;
  let errors = 0;

  for (const score of scoreData) {
    const result = await updateGameScore(score.gameId, score.awayScore, score.homeScore, score.completed !== false);
    if (result) {
      updated++;
    } else {
      errors++;
    }
  }

  console.log(`\n📊 Bulk update complete:`);
  console.log(`  ✅ Successfully updated: ${updated} games`);
  console.log(`  ❌ Errors: ${errors} games`);

  return { updated, errors };
}

async function verifyScores() {
  console.log('🔍 Verifying score updates...\n');

  try {
    const week3Games = await prisma.game.findMany({
      where: {
        weekId: '2025-W3'
      },
      orderBy: {
        startAtUtc: 'asc'
      }
    });

    const completedGames = week3Games.filter(g => g.completed);
    const gamesWithScores = week3Games.filter(g => g.homeScore !== null && g.awayScore !== null);

    console.log('📊 Score update verification:');
    console.log(`  - Total Week 3 games: ${week3Games.length}`);
    console.log(`  - Games marked completed: ${completedGames.length}`);
    console.log(`  - Games with scores: ${gamesWithScores.length}`);

    console.log('\n🏈 Sample updated games:');
    week3Games.slice(0, 5).forEach(game => {
      console.log(`  ${game.awayTeam} ${game.awayScore || 'N/A'} - ${game.homeScore || 'N/A'} ${game.homeTeam} (${game.completed ? 'completed' : 'pending'})`);
    });

    // Verify picks are still pending (not calculating results yet)
    const week3Picks = await prisma.pick.findMany({
      where: {
        game: {
          weekId: '2025-W3'
        }
      }
    });

    const picksWithResults = week3Picks.filter(p => p.result && p.result !== 'pending');

    console.log('\n🎯 Pick status verification:');
    console.log(`  - Total picks: ${week3Picks.length}`);
    console.log(`  - Picks with results: ${picksWithResults.length} (should remain 0)`);

    if (picksWithResults.length === 0) {
      console.log('✅ Verification PASSED - scores updated, pick results untouched');
    } else {
      console.log('⚠️  Warning - some picks may have been calculated');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

async function main() {
  console.log('🏈 Week 3 Score Update Tool\n');
  console.log('This script will:');
  console.log('✅ Update game scores only');
  console.log('✅ Mark games as completed');
  console.log('🚫 NOT calculate pick results (spreads come later)');
  console.log('');

  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    await listWeek3Games();
  } else if (args.includes('--verify')) {
    await verifyScores();
  } else if (args.includes('--update')) {
    // Example usage - you'll provide the actual score data
    const exampleScores = [
      { gameId: 'game-id', awayScore: 21, homeScore: 17, completed: true },
      // Add more scores here...
    ];

    console.log('Ready to receive score data...');
    console.log('Please provide scores in the format:');
    console.log('{ gameId: "game-id", awayScore: 21, homeScore: 17, completed: true }');
  } else {
    console.log('Usage:');
    console.log('  node update-week3-scores.js --list      # List all Week 3 games');
    console.log('  node update-week3-scores.js --update    # Update scores (with data)');
    console.log('  node update-week3-scores.js --verify    # Verify score updates');
  }

  await prisma.$disconnect();
}

// Export functions for external use
module.exports = {
  listWeek3Games,
  updateGameScore,
  updateBulkScores,
  verifyScores
};

if (require.main === module) {
  main().catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  });
}