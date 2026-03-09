const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function completeFinalPicks() {
  console.log('🎯 Completing final Week 3 picks...\n');

  try {
    let updated = 0;

    // SF @ ARI: Cardinals won spread, so all 49ers picks (away) lose
    const sf49ersLose = await prisma.pick.updateMany({
      where: {
        game: {
          weekId: '2025-W3',
          awayTeam: { contains: '49ers' },
          homeTeam: { contains: 'Cardinals' }
        },
        choice: 'away',
        status: 'pending'
      },
      data: {
        result: 'lost:0',
        status: 'lost',
        payout: 0
      }
    });

    console.log(`📊 SF @ ARI: Cardinals won spread`);
    console.log(`   Updated ${sf49ersLose.count} 49ers picks → LOST`);
    updated += sf49ersLose.count;

    // CHI @ DAL: Bears won spread
    // Bears picks (away) win
    const bearsWin = await prisma.pick.updateMany({
      where: {
        game: {
          weekId: '2025-W3',
          awayTeam: { contains: 'Bears' },
          homeTeam: { contains: 'Cowboys' }
        },
        choice: 'away',
        status: 'pending'
      },
      data: {
        result: 'won:10',
        status: 'won',
        payout: 10
      }
    });

    // Cowboys picks (home) lose
    const cowboysLose = await prisma.pick.updateMany({
      where: {
        game: {
          weekId: '2025-W3',
          awayTeam: { contains: 'Bears' },
          homeTeam: { contains: 'Cowboys' }
        },
        choice: 'home',
        status: 'pending'
      },
      data: {
        result: 'lost:0',
        status: 'lost',
        payout: 0
      }
    });

    console.log(`📊 CHI @ DAL: Bears won spread`);
    console.log(`   Updated ${bearsWin.count} Bears picks → WON`);
    console.log(`   Updated ${cowboysLose.count} Cowboys picks → LOST`);
    updated += bearsWin.count + cowboysLose.count;

    // Final verification
    const finalStats = await Promise.all([
      prisma.pick.count({ where: { game: { weekId: '2025-W3' } } }),
      prisma.pick.count({ where: { game: { weekId: '2025-W3' }, status: 'won' } }),
      prisma.pick.count({ where: { game: { weekId: '2025-W3' }, status: 'lost' } }),
      prisma.pick.count({ where: { game: { weekId: '2025-W3' }, status: 'pending' } })
    ]);

    const [totalPicks, wonPicks, lostPicks, pendingPicks] = finalStats;

    console.log(`\n🎉 WEEK 3 PICK RESULTS COMPLETE!\n`);
    console.log(`📊 Final Summary:`);
    console.log(`   Total picks: ${totalPicks}`);
    console.log(`   Won picks: ${wonPicks} (${Math.round(wonPicks/totalPicks*100)}%)`);
    console.log(`   Lost picks: ${lostPicks} (${Math.round(lostPicks/totalPicks*100)}%)`);
    console.log(`   Pending picks: ${pendingPicks}`);
    console.log(`   Picks updated this run: ${updated}`);

    if (pendingPicks === 0) {
      console.log('\n✅ ALL WEEK 3 PICKS PROCESSED SUCCESSFULLY!');
    } else {
      console.log(`\n⚠️  ${pendingPicks} picks still pending`);
    }

  } catch (error) {
    console.error('❌ Error completing picks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeFinalPicks();