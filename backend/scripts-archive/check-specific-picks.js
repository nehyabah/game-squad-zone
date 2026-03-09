const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpecificPicks() {
  console.log('🔍 Checking Week 3 picks for Arizona Cardinals and Chicago Bears...\n');

  try {
    // Check SF @ ARI game picks
    const sfAriGame = await prisma.game.findFirst({
      where: {
        weekId: '2025-W3',
        OR: [
          { awayTeam: { contains: '49ers' }, homeTeam: { contains: 'Cardinals' } },
          { awayTeam: { contains: 'Cardinals' }, homeTeam: { contains: '49ers' } }
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

    if (sfAriGame) {
      console.log(`🏈 ${sfAriGame.awayTeam} @ ${sfAriGame.homeTeam} (${sfAriGame.awayScore}-${sfAriGame.homeScore})`);
      console.log(`   Total picks: ${sfAriGame.picks.length}`);

      const homePicks = sfAriGame.picks.filter(p => p.choice === 'home');
      const awayPicks = sfAriGame.picks.filter(p => p.choice === 'away');

      console.log(`   Home picks (${sfAriGame.homeTeam}): ${homePicks.length}`);
      console.log(`   Away picks (${sfAriGame.awayTeam}): ${awayPicks.length}`);

      if (homePicks.length > 0) {
        console.log('   Users who picked HOME (Cardinals):');
        homePicks.forEach(pick => {
          console.log(`     - ${pick.pickSet.user.username || pick.pickSet.user.email}`);
        });
      } else {
        console.log('   ❌ NO ONE picked Arizona Cardinals');
      }
    }

    // Check CHI @ DAL game picks
    const chiDalGame = await prisma.game.findFirst({
      where: {
        weekId: '2025-W3',
        OR: [
          { awayTeam: { contains: 'Bears' }, homeTeam: { contains: 'Cowboys' } },
          { awayTeam: { contains: 'Cowboys' }, homeTeam: { contains: 'Bears' } }
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

    console.log('');
    if (chiDalGame) {
      console.log(`🏈 ${chiDalGame.awayTeam} @ ${chiDalGame.homeTeam} (${chiDalGame.awayScore}-${chiDalGame.homeScore})`);
      console.log(`   Total picks: ${chiDalGame.picks.length}`);

      const homePicks = chiDalGame.picks.filter(p => p.choice === 'home');
      const awayPicks = chiDalGame.picks.filter(p => p.choice === 'away');

      console.log(`   Home picks (${chiDalGame.homeTeam}): ${homePicks.length}`);
      console.log(`   Away picks (${chiDalGame.awayTeam}): ${awayPicks.length}`);

      if (awayPicks.length > 0) {
        console.log('   Users who picked AWAY (Bears):');
        awayPicks.forEach(pick => {
          console.log(`     - ${pick.pickSet.user.username || pick.pickSet.user.email}`);
        });
      } else {
        console.log('   ❌ NO ONE picked Chicago Bears');
      }
    }

    console.log('\n📊 Summary:');
    const ariPickCount = sfAriGame ? sfAriGame.picks.filter(p => p.choice === 'home').length : 0;
    const chiPickCount = chiDalGame ? chiDalGame.picks.filter(p => p.choice === 'away').length : 0;

    console.log(`   Arizona Cardinals picks: ${ariPickCount}`);
    console.log(`   Chicago Bears picks: ${chiPickCount}`);

    if (ariPickCount === 0 && chiPickCount === 0) {
      console.log('   ✅ NO ONE picked either Arizona or Chicago - no updates needed!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificPicks();