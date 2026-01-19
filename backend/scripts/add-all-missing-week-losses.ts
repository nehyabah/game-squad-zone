import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMissingWeekLossesForUser(user: any, weeksWithoutPicks: any[]) {
  for (const { weekId } of weeksWithoutPicks) {
    console.log(`\n🔄 Processing week ${weekId} for ${user.username}...`);

    // Get 3 completed games from this week
    const games = await prisma.game.findMany({
      where: {
        weekId,
        completed: true
      },
      take: 3
    });

    if (games.length < 3) {
      console.log(`⚠️  Week ${weekId} doesn't have 3 completed games yet (only ${games.length}), skipping...`);
      continue;
    }

    // Create the PickSet
    const pickSet = await prisma.pickSet.create({
      data: {
        userId: user.id,
        weekId,
        status: 'submitted',
        submittedAtUtc: new Date(),
        lockedAtUtc: new Date(),
      }
    });

    console.log(`  ✅ Created PickSet for week ${weekId}`);

    // Create 3 picks for teams that actually lost
    for (let i = 0; i < 3; i++) {
      const game = games[i];

      // Pick the team that lost (based on final score)
      let losingTeam: string;
      if (game.homeScore !== null && game.awayScore !== null) {
        losingTeam = game.homeScore < game.awayScore ? game.homeTeam : game.awayTeam;
      } else {
        losingTeam = game.awayTeam;
      }

      // Get the spread for this game
      const gameLine = await prisma.gameLine.findFirst({
        where: { gameId: game.id },
        orderBy: { fetchedAtUtc: 'desc' }
      });

      await prisma.pick.create({
        data: {
          pickSetId: pickSet.id,
          gameId: game.id,
          choice: losingTeam,
          spreadAtPick: gameLine?.spread || 0,
          lineSource: 'penalty',
          status: 'lost',
          result: 'lost:0',
          payout: -1.0,
          odds: -110
        }
      });

      console.log(`    ❌ Loss ${i + 1}/3: ${losingTeam} vs ${game.homeTeam === losingTeam ? game.awayTeam : game.homeTeam} (${game.homeScore}-${game.awayScore})`);
    }

    console.log(`  ✅ Added 3 losses for week ${weekId}`);
  }
}

async function addAllMissingWeekLosses() {
  try {
    // Get all unique weeks with completed games
    const weeks = await prisma.game.findMany({
      where: {
        completed: true
      },
      select: { weekId: true },
      distinct: ['weekId'],
      orderBy: { weekId: 'asc' }
    });

    console.log(`📅 Total weeks with completed games: ${weeks.length}`);
    console.log(`   Weeks: ${weeks.map(w => w.weekId).join(', ')}\n`);

    // Get all users who have made at least one pick
    const usersWithPicks = await prisma.user.findMany({
      where: {
        pickSets: {
          some: {}
        }
      },
      select: {
        id: true,
        username: true,
        email: true
      }
    });

    console.log(`👥 Found ${usersWithPicks.length} users with picks\n`);

    let totalUsersProcessed = 0;
    let totalWeeksAdded = 0;

    for (const user of usersWithPicks) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`👤 Checking user: ${user.username} (${user.email})`);

      // Get weeks where user has picks
      const userPickSets = await prisma.pickSet.findMany({
        where: { userId: user.id },
        select: { weekId: true }
      });

      const weeksWithPicks = new Set(userPickSets.map(ps => ps.weekId));
      console.log(`✅ User has picks in ${weeksWithPicks.size} weeks`);

      // Find weeks without picks (only from completed weeks)
      const weeksWithoutPicks = weeks.filter(w => !weeksWithPicks.has(w.weekId));

      if (weeksWithoutPicks.length === 0) {
        console.log(`✅ User has picks in all completed weeks!`);
        continue;
      }

      console.log(`❌ Missing picks in ${weeksWithoutPicks.length} weeks: ${weeksWithoutPicks.map(w => w.weekId).join(', ')}`);

      // Add missing week losses for this user
      await addMissingWeekLossesForUser(user, weeksWithoutPicks);

      totalUsersProcessed++;
      totalWeeksAdded += weeksWithoutPicks.length;

      console.log(`\n✅ Finished processing ${user.username} - added ${weeksWithoutPicks.length} weeks`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`\n🎉 SUMMARY:`);
    console.log(`   👥 Users processed: ${totalUsersProcessed}`);
    console.log(`   📅 Total weeks added: ${totalWeeksAdded}`);
    console.log(`   ❌ Total penalty losses added: ${totalWeeksAdded * 3}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('🚀 Starting bulk penalty loss addition for all users...\n');
addAllMissingWeekLosses();
