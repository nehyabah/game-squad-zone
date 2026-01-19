import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMissingWeekLosses(username: string) {
  try {
    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { firstName: { equals: username, mode: 'insensitive' } },
          { displayName: { equals: username, mode: 'insensitive' } },
        ]
      }
    });

    if (!user) {
      console.log(`❌ User "${username}" not found`);
      return;
    }

    console.log(`✅ Found user: ${user.username} (${user.email})`);

    // Get all unique weeks from games
    const weeks = await prisma.game.findMany({
      select: { weekId: true },
      distinct: ['weekId'],
      orderBy: { weekId: 'asc' }
    });

    console.log(`📅 Total weeks in database: ${weeks.length}`);

    // Get weeks where user has picks
    const userPickSets = await prisma.pickSet.findMany({
      where: { userId: user.id },
      select: { weekId: true }
    });

    const weeksWithPicks = new Set(userPickSets.map(ps => ps.weekId));
    console.log(`✅ User has picks in ${weeksWithPicks.size} weeks`);

    // Find weeks without picks
    const weeksWithoutPicks = weeks.filter(w => !weeksWithPicks.has(w.weekId));
    console.log(`❌ Missing picks in ${weeksWithoutPicks.length} weeks: ${weeksWithoutPicks.map(w => w.weekId).join(', ')}`);

    if (weeksWithoutPicks.length === 0) {
      console.log('✅ User has picks in all weeks!');
      return;
    }

    // For each week without picks, create a PickSet with 3 losing picks
    for (const { weekId } of weeksWithoutPicks) {
      console.log(`\n🔄 Processing week ${weekId}...`);

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
          // If no score, default to away team
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

    console.log(`\n✅ Finished processing ${weeksWithoutPicks.length} weeks for ${user.username}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get username from command line argument
const username = process.argv[2];

if (!username) {
  console.log('Usage: ts-node add-missing-week-losses.ts <username>');
  console.log('Example: ts-node add-missing-week-losses.ts Eoin');
  process.exit(1);
}

addMissingWeekLosses(username);
