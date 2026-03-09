const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Spread winners provided by user
const spreadWinners = [
  'JAGS', 'chargers', 'Eagles', 'KC', 'COlts', 'Washington',
  'Seahawks', 'Steelers', 'Seatle', 'Lions', 'Browns', 'Panthers',
  'Jets', 'Vikings'
];

// Map winners to team names and determine home/away
const winnerMappings = [
  { winner: 'JAGS', fullName: 'Jacksonville Jaguars', choice: 'away' }, // JAX @ HOU
  { winner: 'chargers', fullName: 'Los Angeles Chargers', choice: 'away' }, // LAC @ DEN
  { winner: 'Eagles', fullName: 'Philadelphia Eagles', choice: 'away' }, // PHI @ LAR
  { winner: 'KC', fullName: 'Kansas City Chiefs', choice: 'home' }, // NYG @ KC
  { winner: 'COlts', fullName: 'Indianapolis Colts', choice: 'home' }, // TEN @ IND
  { winner: 'Washington', fullName: 'Washington Commanders', choice: 'away' }, // WAS @ LV
  { winner: 'Seahawks', fullName: 'Seattle Seahawks', choice: 'away' }, // SEA @ NO
  { winner: 'Steelers', fullName: 'Pittsburgh Steelers', choice: 'home' }, // NE @ PIT
  { winner: 'Lions', fullName: 'Detroit Lions', choice: 'home' }, // BAL @ DET
  { winner: 'Browns', fullName: 'Cleveland Browns', choice: 'home' }, // GB @ CLE
  { winner: 'Panthers', fullName: 'Carolina Panthers', choice: 'away' }, // CAR @ ATL
  { winner: 'Jets', fullName: 'New York Jets', choice: 'home' }, // TB @ NYJ
  { winner: 'Vikings', fullName: 'Minnesota Vikings', choice: 'away' } // MIN @ CIN
];

async function processAllWinners() {
  console.log('🎯 Processing Week 3 spread winners...\n');

  try {
    // Get all games with picks
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
      }
    });

    const gamesWithPicks = games.filter(g => g.picks.length > 0);
    console.log(`📊 Found ${gamesWithPicks.length} games with picks to process\n`);

    let totalUpdated = 0;
    let wins = 0;
    let losses = 0;

    for (const game of gamesWithPicks) {
      console.log(`🏈 ${game.awayTeam} @ ${game.homeTeam} (${game.awayScore}-${game.homeScore})`);

      // Find the winner for this game
      let winningChoice = null;
      let winnerTeam = null;

      // Check if home team won the spread
      const homeWinner = winnerMappings.find(w =>
        game.homeTeam.includes(w.fullName.split(' ')[1]) ||
        game.homeTeam.includes(w.fullName.split(' ')[0]) ||
        w.fullName.includes(game.homeTeam.split(' ')[1]) ||
        w.fullName.includes(game.homeTeam.split(' ')[0])
      );

      // Check if away team won the spread
      const awayWinner = winnerMappings.find(w =>
        game.awayTeam.includes(w.fullName.split(' ')[1]) ||
        game.awayTeam.includes(w.fullName.split(' ')[0]) ||
        w.fullName.includes(game.awayTeam.split(' ')[1]) ||
        w.fullName.includes(game.awayTeam.split(' ')[0])
      );

      if (homeWinner) {
        winningChoice = 'home';
        winnerTeam = game.homeTeam;
      } else if (awayWinner) {
        winningChoice = 'away';
        winnerTeam = game.awayTeam;
      }

      if (winningChoice) {
        console.log(`   ✅ Spread winner: ${winnerTeam} (${winningChoice})`);

        // Update all picks for this game
        for (const pick of game.picks) {
          let result, points, status;

          if (pick.choice === winningChoice) {
            result = 'won:10';
            points = 10;
            status = 'won';
            wins++;
          } else {
            result = 'lost:0';
            points = 0;
            status = 'lost';
            losses++;
          }

          await prisma.pick.update({
            where: { id: pick.id },
            data: {
              result: result,
              status: status,
              payout: parseFloat(points)
            }
          });

          totalUpdated++;
        }

        console.log(`   📊 Updated ${game.picks.length} picks`);
      } else {
        console.log(`   ❌ No spread winner found for this game`);
      }
      console.log('');
    }

    console.log(`\n📊 Final Results Summary:`);
    console.log(`  🎯 Total picks updated: ${totalUpdated}`);
    console.log(`  ✅ Winning picks: ${wins}`);
    console.log(`  ❌ Losing picks: ${losses}`);

    return { totalUpdated, wins, losses };

  } catch (error) {
    console.error('❌ Error processing winners:', error);
    throw error;
  }
}

async function verifyPickResults() {
  console.log('\n🔍 Verifying all pick results...\n');

  try {
    const picks = await prisma.pick.findMany({
      where: {
        game: { weekId: '2025-W3' }
      }
    });

    const wonPicks = picks.filter(p => p.status === 'won');
    const lostPicks = picks.filter(p => p.status === 'lost');
    const pendingPicks = picks.filter(p => p.status === 'pending' || !p.result);

    console.log('📊 Pick Results Verification:');
    console.log(`  - Total picks: ${picks.length}`);
    console.log(`  - Won picks: ${wonPicks.length}`);
    console.log(`  - Lost picks: ${lostPicks.length}`);
    console.log(`  - Pending picks: ${pendingPicks.length}`);

    if (pendingPicks.length === 0) {
      console.log('✅ All Week 3 picks have been processed successfully!');
    } else {
      console.log('⚠️  Some picks are still pending');
    }

    return {
      total: picks.length,
      won: wonPicks.length,
      lost: lostPicks.length,
      pending: pendingPicks.length
    };

  } catch (error) {
    console.error('❌ Error verifying results:', error);
    return null;
  }
}

async function main() {
  console.log('🏈 Week 3 Spread Winners Processor\n');
  console.log('Processing spread winners:', spreadWinners.join(', '));
  console.log('');

  try {
    await processAllWinners();
    await verifyPickResults();
    console.log('\n🎉 Week 3 pick results processing complete!');
  } catch (error) {
    console.error('💥 Processing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}