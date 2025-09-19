const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function verifyFinalData() {
  try {
    console.log('🔍 === FINAL DATA VERIFICATION ===');

    // Check Week 1 data
    const week1PickSets = await prisma.pickSet.count({ where: { weekId: '2025-W1' } });
    const week1Picks = await prisma.pick.count({ where: { pickSet: { weekId: '2025-W1' } } });
    const week1Games = await prisma.game.count({ where: { weekId: '2025-W1' } });
    const week1Won = await prisma.pick.count({
      where: {
        pickSet: { weekId: '2025-W1' },
        status: 'won'
      }
    });
    const week1Lost = await prisma.pick.count({
      where: {
        pickSet: { weekId: '2025-W1' },
        status: 'lost'
      }
    });

    // Check Week 2 data
    const week2PickSets = await prisma.pickSet.count({ where: { weekId: '2025-W2' } });
    const week2Picks = await prisma.pick.count({ where: { pickSet: { weekId: '2025-W2' } } });
    const week2Games = await prisma.game.count({ where: { weekId: '2025-W2' } });
    const week2Won = await prisma.pick.count({
      where: {
        pickSet: { weekId: '2025-W2' },
        status: 'won'
      }
    });
    const week2Lost = await prisma.pick.count({
      where: {
        pickSet: { weekId: '2025-W2' },
        status: 'lost'
      }
    });

    console.log('\\n📊 WEEK 1 DATA:');
    console.log(`   - Pick sets: ${week1PickSets}`);
    console.log(`   - Total picks: ${week1Picks}`);
    console.log(`   - Games: ${week1Games}`);
    console.log(`   - Won picks: ${week1Won}`);
    console.log(`   - Lost picks: ${week1Lost}`);
    console.log(`   - Avg picks per user: ${(week1Picks/week1PickSets).toFixed(1)}`);

    console.log('\\n📊 WEEK 2 DATA:');
    console.log(`   - Pick sets: ${week2PickSets}`);
    console.log(`   - Total picks: ${week2Picks}`);
    console.log(`   - Games: ${week2Games}`);
    console.log(`   - Won picks: ${week2Won}`);
    console.log(`   - Lost picks: ${week2Lost}`);
    console.log(`   - Avg picks per user: ${(week2Picks/week2PickSets).toFixed(1)}`);

    console.log('\\n🎯 TOTAL DATA:');
    console.log(`   - Total pick sets: ${week1PickSets + week2PickSets}`);
    console.log(`   - Total picks: ${week1Picks + week2Picks}`);
    console.log(`   - Total games: ${week1Games + week2Games}`);
    console.log(`   - Total won picks: ${week1Won + week2Won}`);
    console.log(`   - Total lost picks: ${week1Lost + week2Lost}`);

    // Sample some pick data for verification
    console.log('\\n🔍 SAMPLE PICK DATA:');
    const samplePicks = await prisma.pick.findMany({
      take: 5,
      include: {
        pickSet: {
          include: {
            user: true
          }
        },
        game: true
      }
    });

    samplePicks.forEach(pick => {
      console.log(`   - ${pick.pickSet.user.displayName || pick.pickSet.user.username}: ${pick.choice} in ${pick.game.awayTeam} @ ${pick.game.homeTeam} (${pick.status})`);
    });

    // Check for any users with more than 3 picks per week
    console.log('\\n⚠️  CHECKING FOR EXCESSIVE PICKS:');
    const pickCounts = await prisma.pickSet.findMany({
      include: {
        picks: true,
        user: true
      }
    });

    const issues = pickCounts.filter(ps => ps.picks.length > 3);
    if (issues.length > 0) {
      console.log(`   - Found ${issues.length} users with >3 picks:`);
      issues.forEach(ps => {
        console.log(`     * ${ps.user.displayName || ps.user.username} (${ps.weekId}): ${ps.picks.length} picks`);
      });
    } else {
      console.log(`   - ✅ All users have ≤3 picks per week`);
    }

    console.log('\\n✅ DATA VERIFICATION COMPLETE');

  } catch (error) {
    console.error('❌ Verification error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyFinalData();