const { PrismaClient } = require('@prisma/client');

async function addStephenWeek2Picks() {
  const prisma = new PrismaClient();

  try {
    console.log('🏈 Adding Stephen Lennon Week 2 picks...');

    const stephenId = '71175283-7a26-462a-97a2-18683270a2b1';
    const weekId = '2025-W2';

    // Find the games for Bengals, Cardinals, Eagles in Week 2
    const bengalsGame = await prisma.game.findFirst({
      where: {
        weekId,
        OR: [
          { homeTeam: { contains: 'Bengal' } },
          { awayTeam: { contains: 'Bengal' } }
        ]
      }
    });

    const cardinalsGame = await prisma.game.findFirst({
      where: {
        weekId,
        OR: [
          { homeTeam: { contains: 'Cardinal' } },
          { awayTeam: { contains: 'Cardinal' } }
        ]
      }
    });

    const eaglesGame = await prisma.game.findFirst({
      where: {
        weekId,
        OR: [
          { homeTeam: { contains: 'Eagle' } },
          { awayTeam: { contains: 'Eagle' } }
        ]
      }
    });

    console.log('Found games:');
    console.log(`- Bengals: ${bengalsGame?.awayTeam} @ ${bengalsGame?.homeTeam}`);
    console.log(`- Cardinals: ${cardinalsGame?.awayTeam} @ ${cardinalsGame?.homeTeam}`);
    console.log(`- Eagles: ${eaglesGame?.awayTeam} @ ${eaglesGame?.homeTeam}`);

    // Create or update Stephen's PickSet for Week 2
    const pickSet = await prisma.pickSet.upsert({
      where: {
        userId_weekId: {
          userId: stephenId,
          weekId: weekId
        }
      },
      update: {
        status: 'submitted',
        submittedAtUtc: new Date()
      },
      create: {
        userId: stephenId,
        weekId: weekId,
        status: 'submitted',
        submittedAtUtc: new Date()
      }
    });

    console.log(`✅ Created/updated PickSet: ${pickSet.id}`);

    // Add the three picks
    const picks = [
      {
        gameId: bengalsGame.id,
        choice: bengalsGame.homeTeam.includes('Bengal') ? 'home' : 'away', // Pick Bengals
        result: 'won',
        status: 'won',
        payout: 10
      },
      {
        gameId: cardinalsGame.id,
        choice: cardinalsGame.homeTeam.includes('Cardinal') ? 'home' : 'away', // Pick Cardinals
        result: 'lost',
        status: 'lost',
        payout: 0
      },
      {
        gameId: eaglesGame.id,
        choice: eaglesGame.homeTeam.includes('Eagle') ? 'home' : 'away', // Pick Eagles
        result: 'won',
        status: 'won',
        payout: 10
      }
    ];

    for (const pickData of picks) {
      const pick = await prisma.pick.upsert({
        where: {
          pickSetId_gameId: {
            pickSetId: pickSet.id,
            gameId: pickData.gameId
          }
        },
        update: {
          choice: pickData.choice,
          status: pickData.status,
          result: `${pickData.result}:${pickData.payout}`,
          payout: pickData.payout,
          spreadAtPick: 0, // Default spread
          lineSource: 'manual-entry'
        },
        create: {
          pickSetId: pickSet.id,
          gameId: pickData.gameId,
          choice: pickData.choice,
          status: pickData.status,
          result: `${pickData.result}:${pickData.payout}`,
          payout: pickData.payout,
          spreadAtPick: 0,
          lineSource: 'manual-entry'
        }
      });

      const game = await prisma.game.findUnique({ where: { id: pickData.gameId } });
      const teamPicked = pickData.choice === 'home' ? game.homeTeam : game.awayTeam;

      console.log(`✅ Added pick: ${teamPicked} - ${pickData.status.toUpperCase()} (${pickData.payout} points)`);
    }

    console.log('\n🎉 Stephen Lennon Week 2 picks added successfully!');
    console.log('📊 Summary:');
    console.log('- ✅ Bengals: WON (+10)');
    console.log('- ❌ Cardinals: LOST (0)');
    console.log('- ✅ Eagles: WON (+10)');
    console.log('- 📈 Total: 20 points');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addStephenWeek2Picks();