const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndFixEaglesGame() {
  console.log('🔍 Checking and fixing Eagles vs Rams game results...\n');

  try {
    const eaglesGame = await prisma.game.findFirst({
      where: {
        weekId: '2025-W3',
        OR: [
          { awayTeam: { contains: 'Eagles' }, homeTeam: { contains: 'Rams' } },
          { awayTeam: { contains: 'Rams' }, homeTeam: { contains: 'Eagles' } }
        ]
      },
      include: {
        picks: {
          include: {
            pickSet: {
              include: {
                user: { select: { username: true, email: true } }
              }
            }
          }
        }
      }
    });

    if (eaglesGame) {
      console.log(`🏈 ${eaglesGame.awayTeam} @ ${eaglesGame.homeTeam}`);
      console.log(`   Score: ${eaglesGame.awayScore} - ${eaglesGame.homeScore}`);
      console.log(`   Total picks: ${eaglesGame.picks.length}`);

      const homePicks = eaglesGame.picks.filter(p => p.choice === 'home');
      const awayPicks = eaglesGame.picks.filter(p => p.choice === 'away');

      console.log(`   Home picks (${eaglesGame.homeTeam}): ${homePicks.length}`);
      console.log(`   Away picks (${eaglesGame.awayTeam}): ${awayPicks.length}`);

      console.log('\n📊 Current Pick Results:');
      eaglesGame.picks.forEach(pick => {
        const user = pick.pickSet.user.username || pick.pickSet.user.email;
        console.log(`   ${user}: picked ${pick.choice} → ${pick.status} (${pick.result})`);
      });

      console.log('\n🔄 Fixing Eagles picks...');
      console.log('   Eagles won the spread and are the AWAY team');
      console.log('   So picks with choice="away" should WIN, choice="home" should LOSE');

      let fixed = 0;

      // Fix Eagles picks (away) - should WIN
      const eaglesWinUpdate = await prisma.pick.updateMany({
        where: {
          game: { id: eaglesGame.id },
          choice: 'away'
        },
        data: {
          result: 'won:10',
          status: 'won',
          payout: 10
        }
      });

      console.log(`   ✅ Fixed ${eaglesWinUpdate.count} Eagles picks → WON`);
      fixed += eaglesWinUpdate.count;

      // Fix Rams picks (home) - should LOSE
      const ramsLoseUpdate = await prisma.pick.updateMany({
        where: {
          game: { id: eaglesGame.id },
          choice: 'home'
        },
        data: {
          result: 'lost:0',
          status: 'lost',
          payout: 0
        }
      });

      console.log(`   ✅ Fixed ${ramsLoseUpdate.count} Rams picks → LOST`);
      fixed += ramsLoseUpdate.count;

      console.log(`\n📊 Total picks corrected: ${fixed}`);

      // Verify the fix
      const updatedPicks = await prisma.pick.findMany({
        where: { game: { id: eaglesGame.id } },
        include: {
          pickSet: {
            include: {
              user: { select: { username: true, email: true } }
            }
          }
        }
      });

      console.log('\n✅ Corrected Results:');
      updatedPicks.forEach(pick => {
        const user = pick.pickSet.user.username || pick.pickSet.user.email;
        console.log(`   ${user}: picked ${pick.choice} → ${pick.status} (${pick.result})`);
      });

    } else {
      console.log('❌ Eagles vs Rams game not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixEaglesGame();