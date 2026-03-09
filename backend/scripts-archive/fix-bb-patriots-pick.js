const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixBBPatriotsPick() {
  console.log('🔍 Finding BB user and fixing Steelers vs Patriots pick...\n');

  try {
    // Find BB user by email
    const users = await prisma.user.findMany({
      where: {
        email: 'brianbyrne92@gmail.com'
      },
      include: {
        pickSets: {
          where: { weekId: '2025-W3' },
          include: {
            picks: {
              include: {
                game: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 Found ${users.length} BB users:`);
    users.forEach(user => {
      const week3PickSet = user.pickSets.find(ps => ps.weekId === '2025-W3');
      console.log(`   ${user.email}: ${week3PickSet ? week3PickSet.picks.length : 0} Week 3 picks`);
    });

    if (users.length === 0) {
      console.log('❌ BB user not found');
      return;
    }

    // Find the BB user with Steelers vs Patriots pick
    let bbUser = null;
    let steelersPatriotsPick = null;

    for (const user of users) {
      const week3PickSet = user.pickSets.find(ps => ps.weekId === '2025-W3');
      if (week3PickSet) {
        const pick = week3PickSet.picks.find(p =>
          (p.game.homeTeam.includes('Steelers') && p.game.awayTeam.includes('Patriots')) ||
          (p.game.homeTeam.includes('Patriots') && p.game.awayTeam.includes('Steelers'))
        );
        if (pick) {
          bbUser = user;
          steelersPatriotsPick = pick;
          break;
        }
      }
    }

    if (!bbUser || !steelersPatriotsPick) {
      console.log('❌ BB user with Steelers vs Patriots pick not found');
      return;
    }

    console.log(`👤 Found BB user: ${bbUser.username || bbUser.email} (ID: ${bbUser.id})`);
    console.log(`🏈 Found Steelers vs Patriots pick:`);
    console.log(`   Game: ${steelersPatriotsPick.game.awayTeam} @ ${steelersPatriotsPick.game.homeTeam}`);
    console.log(`   Score: ${steelersPatriotsPick.game.awayScore}-${steelersPatriotsPick.game.homeScore}`);
    console.log(`   Current pick: ${steelersPatriotsPick.choice} (${steelersPatriotsPick.status})`);

    // Determine the correct choice for Patriots
    const patriotsChoice = steelersPatriotsPick.game.awayTeam.includes('Patriots') ? 'away' : 'home';

    console.log(`\n🔄 Changing pick to Patriots (${patriotsChoice}) - this will be a LOSS`);
    console.log(`   Patriots are: ${patriotsChoice}`);
    console.log(`   Game result: Steelers won 21-14, so Patriots lost`);

    // Update the pick
    const updatedPick = await prisma.pick.update({
      where: { id: steelersPatriotsPick.id },
      data: {
        choice: patriotsChoice,
        result: 'lost:0',
        status: 'lost',
        payout: 0
      }
    });

    console.log(`\n✅ Updated BB's pick:`);
    console.log(`   Old: ${steelersPatriotsPick.choice} → ${steelersPatriotsPick.status}`);
    console.log(`   New: ${updatedPick.choice} → ${updatedPick.status} (${updatedPick.result})`);

    // Show BB's complete Week 3 summary
    const bbWeek3PickSet = await prisma.pickSet.findFirst({
      where: {
        userId: bbUser.id,
        weekId: '2025-W3'
      },
      include: {
        picks: {
          include: {
            game: true
          }
        }
      }
    });

    console.log(`\n📊 BB's complete Week 3 summary:`);
    console.log(`   User: ${bbUser.email}`);
    console.log(`   Total picks: ${bbWeek3PickSet.picks.length}`);

    const wonPicks = bbWeek3PickSet.picks.filter(p => p.status === 'won').length;
    const lostPicks = bbWeek3PickSet.picks.filter(p => p.status === 'lost').length;

    console.log(`   Won picks: ${wonPicks}`);
    console.log(`   Lost picks: ${lostPicks}`);
    console.log(`   Total points: ${wonPicks * 10}`);

    console.log(`\n📋 All BB picks:`);
    bbWeek3PickSet.picks.forEach(pick => {
      const teamName = pick.choice === 'home' ? pick.game.homeTeam : pick.game.awayTeam;
      console.log(`     ${teamName}: ${pick.status} (${pick.result})`);
    });

    console.log('\n✅ BB Patriots pick fix complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBBPatriotsPick();