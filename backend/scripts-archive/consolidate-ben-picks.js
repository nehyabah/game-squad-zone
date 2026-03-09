const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function consolidateBenPicks() {
  console.log('🔄 Consolidating Ben accounts - both will have all 3 weeks...\n');

  try {
    // Find both accounts
    const account1 = await prisma.user.findFirst({
      where: { email: 'benkidd2015@gmail.con' }, // Has weeks 1 & 2
      include: {
        pickSets: {
          include: { picks: true },
          orderBy: { weekId: 'asc' }
        }
      }
    });

    const account2 = await prisma.user.findFirst({
      where: { email: 'benkidd2015@gmail.com' }, // Has week 3
      include: {
        pickSets: {
          include: { picks: true },
          orderBy: { weekId: 'asc' }
        }
      }
    });

    if (!account1 || !account2) {
      console.log('❌ Could not find both Ben accounts');
      return;
    }

    console.log(`👤 Account 1: ${account1.email} (${account1.id})`);
    console.log(`👤 Account 2: ${account2.email} (${account2.id})`);

    // Step 1: Copy Week 3 from Account 2 to Account 1
    console.log('\n📋 Step 1: Copying Week 3 from Account 2 to Account 1...');

    const week3PickSet = account2.pickSets.find(ps => ps.weekId === '2025-W3');
    if (week3PickSet) {
      // Create Week 3 pick set for Account 1
      const newPickSet1 = await prisma.pickSet.create({
        data: {
          userId: account1.id,
          weekId: '2025-W3',
          status: week3PickSet.status,
          submittedAtUtc: week3PickSet.submittedAtUtc,
          lockedAtUtc: week3PickSet.lockedAtUtc,
          tiebreakerScore: week3PickSet.tiebreakerScore
        }
      });

      console.log(`✅ Created Week 3 pick set for Account 1: ${newPickSet1.id}`);

      // Copy all picks
      for (const pick of week3PickSet.picks) {
        await prisma.pick.create({
          data: {
            pickSetId: newPickSet1.id,
            gameId: pick.gameId,
            choice: pick.choice,
            spreadAtPick: pick.spreadAtPick,
            lineSource: pick.lineSource,
            createdAtUtc: pick.createdAtUtc,
            status: pick.status,
            result: pick.result,
            payout: pick.payout,
            odds: pick.odds
          }
        });
      }

      console.log(`✅ Copied ${week3PickSet.picks.length} Week 3 picks to Account 1`);
    }

    // Step 2: Copy Weeks 1 & 2 from Account 1 to Account 2
    console.log('\n📋 Step 2: Copying Weeks 1 & 2 from Account 1 to Account 2...');

    for (const weekId of ['2025-W1', '2025-W2']) {
      const sourcePickSet = account1.pickSets.find(ps => ps.weekId === weekId);
      if (sourcePickSet) {
        // Create pick set for Account 2
        const newPickSet2 = await prisma.pickSet.create({
          data: {
            userId: account2.id,
            weekId: weekId,
            status: sourcePickSet.status,
            submittedAtUtc: sourcePickSet.submittedAtUtc,
            lockedAtUtc: sourcePickSet.lockedAtUtc,
            tiebreakerScore: sourcePickSet.tiebreakerScore
          }
        });

        console.log(`✅ Created ${weekId} pick set for Account 2: ${newPickSet2.id}`);

        // Copy all picks
        for (const pick of sourcePickSet.picks) {
          await prisma.pick.create({
            data: {
              pickSetId: newPickSet2.id,
              gameId: pick.gameId,
              choice: pick.choice,
              spreadAtPick: pick.spreadAtPick,
              lineSource: pick.lineSource,
              createdAtUtc: pick.createdAtUtc,
              status: pick.status,
              result: pick.result,
              payout: pick.payout,
              odds: pick.odds
            }
          });
        }

        console.log(`✅ Copied ${sourcePickSet.picks.length} ${weekId} picks to Account 2`);
      }
    }

    // Step 3: Verification
    console.log('\n🔍 Verification - checking both accounts now have all 3 weeks:');

    const verifyAccount1 = await prisma.user.findFirst({
      where: { id: account1.id },
      include: {
        pickSets: {
          include: { picks: true },
          orderBy: { weekId: 'asc' }
        }
      }
    });

    const verifyAccount2 = await prisma.user.findFirst({
      where: { id: account2.id },
      include: {
        pickSets: {
          include: { picks: true },
          orderBy: { weekId: 'asc' }
        }
      }
    });

    console.log(`\n📊 Account 1 (${verifyAccount1.email}):`);
    verifyAccount1.pickSets.forEach(ps => {
      console.log(`   Week ${ps.weekId}: ${ps.picks.length} picks`);
    });

    console.log(`\n📊 Account 2 (${verifyAccount2.email}):`);
    verifyAccount2.pickSets.forEach(ps => {
      console.log(`   Week ${ps.weekId}: ${ps.picks.length} picks`);
    });

    const account1HasAll3 = verifyAccount1.pickSets.length === 3;
    const account2HasAll3 = verifyAccount2.pickSets.length === 3;

    if (account1HasAll3 && account2HasAll3) {
      console.log('\n✅ SUCCESS: Both Ben accounts now have all 3 weeks!');
    } else {
      console.log('\n⚠️  WARNING: Consolidation may not be complete');
      console.log(`   Account 1 has ${verifyAccount1.pickSets.length}/3 weeks`);
      console.log(`   Account 2 has ${verifyAccount2.pickSets.length}/3 weeks`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

consolidateBenPicks();