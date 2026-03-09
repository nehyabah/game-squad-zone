const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showCurrentPicks() {
  console.log('🎯 Current Week 3 picks awaiting results...\n');

  try {
    // Get all games and their picks
    const games = await prisma.game.findMany({
      where: {
        weekId: '2025-W3',
        completed: true
      },
      include: {
        picks: {
          include: {
            pickSet: {
              include: {
                user: {
                  select: {
                    username: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        startAtUtc: 'asc'
      }
    });

    console.log(`📊 Found ${games.length} completed games with picks:\n`);

    games.forEach(game => {
      if (game.picks.length > 0) {
        console.log(`🏈 ${game.awayTeam} @ ${game.homeTeam} (${game.awayScore}-${game.homeScore})`);
        console.log(`   Picks (${game.picks.length}):`);

        const homePicks = game.picks.filter(p => p.choice === 'home').length;
        const awayPicks = game.picks.filter(p => p.choice === 'away').length;

        console.log(`     Home (${game.homeTeam}): ${homePicks} picks`);
        console.log(`     Away (${game.awayTeam}): ${awayPicks} picks`);
        console.log('');
      }
    });

    return games;

  } catch (error) {
    console.error('❌ Error showing picks:', error);
    return [];
  }
}

async function updatePickResults(spreadWinners) {
  console.log('🎯 Updating pick results based on spread winners...\n');

  try {
    let totalUpdated = 0;
    let wins = 0;
    let losses = 0;
    let pushes = 0;

    for (const winner of spreadWinners) {
      // Find the game(s) for this matchup
      const games = await prisma.game.findMany({
        where: {
          weekId: '2025-W3',
          OR: [
            { homeTeam: winner.homeTeam, awayTeam: winner.awayTeam },
            { homeTeam: winner.awayTeam, awayTeam: winner.homeTeam }
          ]
        },
        include: {
          picks: true
        }
      });

      for (const game of games) {
        if (game.picks.length === 0) continue;

        console.log(`🏈 Processing: ${game.awayTeam} @ ${game.homeTeam}`);
        console.log(`   Spread winner: ${winner.winner}`);

        let winningChoice;
        if (winner.winner === 'home') {
          winningChoice = 'home';
          console.log(`   Winner: ${game.homeTeam} (home)`);
        } else if (winner.winner === 'away') {
          winningChoice = 'away';
          console.log(`   Winner: ${game.awayTeam} (away)`);
        } else {
          // Push
          winningChoice = 'push';
          console.log(`   Result: Push`);
        }

        // Update all picks for this game
        for (const pick of game.picks) {
          let result, points;

          if (winningChoice === 'push') {
            result = 'pushed';
            points = 0; // No points for push
            pushes++;
          } else if (pick.choice === winningChoice) {
            result = 'won';
            points = 10; // Standard points for win
            wins++;
          } else {
            result = 'lost';
            points = 0; // No points for loss
            losses++;
          }

          await prisma.pick.update({
            where: { id: pick.id },
            data: {
              result: `${result}:${points}`,
              status: result,
              payout: parseFloat(points)
            }
          });

          totalUpdated++;
        }

        console.log(`   ✅ Updated ${game.picks.length} picks`);
      }
      console.log('');
    }

    console.log(`📊 Pick Results Summary:`);
    console.log(`  🎯 Total picks updated: ${totalUpdated}`);
    console.log(`  ✅ Wins: ${wins} picks`);
    console.log(`  ❌ Losses: ${losses} picks`);
    console.log(`  ⚖️  Pushes: ${pushes} picks`);

    return { totalUpdated, wins, losses, pushes };

  } catch (error) {
    console.error('❌ Error updating pick results:', error);
    throw error;
  }
}

async function verifyResults() {
  console.log('\n🔍 Verifying pick results...\n');

  try {
    const picks = await prisma.pick.findMany({
      where: {
        game: {
          weekId: '2025-W3'
        }
      },
      include: {
        game: true,
        pickSet: {
          include: {
            user: {
              select: {
                username: true,
                email: true
              }
            }
          }
        }
      }
    });

    const pendingPicks = picks.filter(p => !p.result || p.result === 'pending');
    const processedPicks = picks.filter(p => p.result && p.result !== 'pending');

    const wonPicks = processedPicks.filter(p => p.status === 'won');
    const lostPicks = processedPicks.filter(p => p.status === 'lost');
    const pushedPicks = processedPicks.filter(p => p.status === 'pushed');

    console.log('📊 Verification Results:');
    console.log(`  - Total picks: ${picks.length}`);
    console.log(`  - Processed picks: ${processedPicks.length}`);
    console.log(`  - Pending picks: ${pendingPicks.length}`);
    console.log(`  - Won picks: ${wonPicks.length}`);
    console.log(`  - Lost picks: ${lostPicks.length}`);
    console.log(`  - Pushed picks: ${pushedPicks.length}`);

    if (pendingPicks.length === 0) {
      console.log('✅ All Week 3 picks have been processed!');
    } else {
      console.log('⚠️  Some picks are still pending results');
    }

    return {
      total: picks.length,
      processed: processedPicks.length,
      pending: pendingPicks.length,
      won: wonPicks.length,
      lost: lostPicks.length,
      pushed: pushedPicks.length
    };

  } catch (error) {
    console.error('❌ Error verifying results:', error);
    return null;
  }
}

async function main() {
  console.log('🏈 Week 3 Pick Results Processor\n');

  const args = process.argv.slice(2);

  if (args.includes('--show')) {
    await showCurrentPicks();
  } else if (args.includes('--verify')) {
    await verifyResults();
  } else {
    console.log('Usage:');
    console.log('  node update-pick-results.js --show     # Show current picks');
    console.log('  node update-pick-results.js --verify   # Verify results');
    console.log('');
    console.log('Ready to receive spread winner data in format:');
    console.log('[');
    console.log('  { homeTeam: "Team A", awayTeam: "Team B", winner: "home" },');
    console.log('  { homeTeam: "Team C", awayTeam: "Team D", winner: "away" },');
    console.log('  { homeTeam: "Team E", awayTeam: "Team F", winner: "push" }');
    console.log(']');
  }

  await prisma.$disconnect();
}

module.exports = { showCurrentPicks, updatePickResults, verifyResults };

if (require.main === module) {
  main().catch((e) => {
    console.error('💥 Fatal error:', e);
    process.exit(1);
  });
}