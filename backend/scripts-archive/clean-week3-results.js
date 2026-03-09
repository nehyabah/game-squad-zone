const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function examineWeek3Data() {
  console.log('🔍 Examining Week 3 data...\n');

  try {
    // Find all games for week 3
    const week3Games = await prisma.game.findMany({
      where: {
        weekId: '2025-W3'
      },
      orderBy: {
        startAtUtc: 'asc'
      }
    });

    console.log(`📊 Found ${week3Games.length} games for Week 3:`);
    week3Games.forEach(game => {
      console.log(`  - ${game.id}: ${game.awayTeam} @ ${game.homeTeam}`);
      console.log(`    Start: ${game.startAtUtc}`);
      console.log(`    Completed: ${game.completed}`);
      console.log(`    Score: ${game.awayTeam} ${game.awayScore || 'N/A'} - ${game.homeScore || 'N/A'} ${game.homeTeam}`);
      console.log('');
    });

    // Find all picks for week 3
    const week3PickSets = await prisma.pickSet.findMany({
      where: {
        weekId: '2025-W3'
      },
      include: {
        picks: {
          include: {
            game: true
          }
        },
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    console.log(`\n🎯 Found ${week3PickSets.length} pick sets for Week 3:`);
    week3PickSets.forEach(pickSet => {
      console.log(`  User: ${pickSet.user.username || pickSet.user.email}`);
      console.log(`  Status: ${pickSet.status}`);
      console.log(`  Picks: ${pickSet.picks.length}`);
      pickSet.picks.forEach(pick => {
        console.log(`    - ${pick.game.awayTeam} @ ${pick.game.homeTeam}: ${pick.choice} (${pick.status}, result: ${pick.result || 'pending'})`);
      });
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error examining data:', error);
  }
}

async function cleanWeek3Results() {
  console.log('🧹 Starting Week 3 results cleanup...\n');

  try {
    // First, let's see what we're about to change
    const week3Games = await prisma.game.findMany({
      where: {
        weekId: '2025-W3'
      }
    });

    const completedGames = week3Games.filter(g => g.completed);
    const gamesWithScores = week3Games.filter(g => g.homeScore !== null || g.awayScore !== null);

    console.log(`📈 Current state:`);
    console.log(`  - Total Week 3 games: ${week3Games.length}`);
    console.log(`  - Games marked completed: ${completedGames.length}`);
    console.log(`  - Games with scores: ${gamesWithScores.length}`);

    // Count picks with results
    const week3Picks = await prisma.pick.findMany({
      where: {
        game: {
          weekId: '2025-W3'
        }
      }
    });

    const picksWithResults = week3Picks.filter(p => p.result && p.result !== 'pending');
    console.log(`  - Total picks: ${week3Picks.length}`);
    console.log(`  - Picks with results: ${picksWithResults.length}`);

    console.log('\n🔄 Cleaning up results...');

    // Step 1: Reset all Week 3 games
    const gameUpdateResult = await prisma.game.updateMany({
      where: {
        weekId: '2025-W3'
      },
      data: {
        completed: false,
        homeScore: null,
        awayScore: null
      }
    });

    console.log(`✅ Updated ${gameUpdateResult.count} games (reset completed=false, cleared scores)`);

    // Step 2: Reset all Week 3 pick results
    const pickUpdateResult = await prisma.pick.updateMany({
      where: {
        game: {
          weekId: '2025-W3'
        }
      },
      data: {
        result: null,
        status: 'pending',
        payout: null
      }
    });

    console.log(`✅ Updated ${pickUpdateResult.count} picks (reset to pending, cleared results and payouts)`);

    console.log('\n🎯 Week 3 cleanup completed successfully!');
    console.log('📝 Summary:');
    console.log('  ✅ All Week 3 games marked as incomplete');
    console.log('  ✅ All Week 3 game scores cleared');
    console.log('  ✅ All Week 3 pick results reset to pending');
    console.log('  ✅ All Week 3 pick payouts cleared');
    console.log('  ✅ All user picks preserved intact');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function verifyCleanup() {
  console.log('\n🔍 Verifying cleanup...\n');

  try {
    const week3Games = await prisma.game.findMany({
      where: {
        weekId: '2025-W3'
      }
    });

    const week3Picks = await prisma.pick.findMany({
      where: {
        game: {
          weekId: '2025-W3'
        }
      }
    });

    const completedGames = week3Games.filter(g => g.completed);
    const gamesWithScores = week3Games.filter(g => g.homeScore !== null || g.awayScore !== null);
    const picksWithResults = week3Picks.filter(p => p.result && p.result !== 'pending');

    console.log('📊 Post-cleanup verification:');
    console.log(`  - Total Week 3 games: ${week3Games.length}`);
    console.log(`  - Games still marked completed: ${completedGames.length} (should be 0)`);
    console.log(`  - Games with scores: ${gamesWithScores.length} (should be 0)`);
    console.log(`  - Total picks preserved: ${week3Picks.length}`);
    console.log(`  - Picks with results: ${picksWithResults.length} (should be 0)`);

    if (completedGames.length === 0 && gamesWithScores.length === 0 && picksWithResults.length === 0) {
      console.log('\n✅ Cleanup verification PASSED - all results removed, picks preserved!');
    } else {
      console.log('\n⚠️  Cleanup verification FAILED - some results may still remain!');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

async function main() {
  console.log('🏈 Week 3 Results Cleanup Tool\n');
  console.log('This script will:');
  console.log('✅ Keep all user picks intact');
  console.log('🧹 Remove all game results and scores');
  console.log('🔄 Reset pick results to pending');
  console.log('');

  const args = process.argv.slice(2);

  if (args.includes('--examine')) {
    await examineWeek3Data();
  } else if (args.includes('--clean')) {
    await cleanWeek3Results();
    await verifyCleanup();
  } else if (args.includes('--verify')) {
    await verifyCleanup();
  } else {
    console.log('Usage:');
    console.log('  node clean-week3-results.js --examine   # View current Week 3 data');
    console.log('  node clean-week3-results.js --clean     # Clean up Week 3 results');
    console.log('  node clean-week3-results.js --verify    # Verify cleanup was successful');
  }

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  });