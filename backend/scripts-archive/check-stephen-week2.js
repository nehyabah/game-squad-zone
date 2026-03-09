const { PrismaClient } = require('@prisma/client');

async function checkStephenLennonWeek2() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Looking for Stephen Lennon in Week 2...');

    // First find Stephen Lennon user
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: 'Stephen', mode: 'insensitive' } },
          { username: { contains: 'Lennon', mode: 'insensitive' } },
          { firstName: { contains: 'Stephen', mode: 'insensitive' } },
          { lastName: { contains: 'Lennon', mode: 'insensitive' } },
          { displayName: { contains: 'Stephen', mode: 'insensitive' } },
          { displayName: { contains: 'Lennon', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        displayName: true,
        email: true
      }
    });

    console.log(`📋 Found ${users.length} users matching 'Stephen Lennon':`);
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.firstName} ${user.lastName}) - ${user.displayName}`);
    });

    if (users.length === 0) {
      console.log('❌ No exact match. Searching more broadly...');

      const broadUsers = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: 'stephen', mode: 'insensitive' } },
            { username: { contains: 'lennon', mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          displayName: true
        }
      });

      console.log(`📋 Broader search found ${broadUsers.length} users:`);
      broadUsers.forEach(user => {
        console.log(`  - ${user.username} (${user.firstName} ${user.lastName}) - ${user.displayName}`);
      });

      if (broadUsers.length === 0) return;
      users.push(...broadUsers);
    }

    // Check Week 2 picks for found users
    for (const user of users) {
      console.log(`\n🎯 Checking Week 2 picks for: ${user.displayName || user.username}`);

      const pickSet = await prisma.pickSet.findUnique({
        where: {
          userId_weekId: {
            userId: user.id,
            weekId: '2025-W2'
          }
        },
        include: {
          picks: {
            include: {
              game: {
                select: {
                  homeTeam: true,
                  awayTeam: true,
                  homeScore: true,
                  awayScore: true,
                  completed: true
                }
              }
            }
          }
        }
      });

      if (!pickSet) {
        console.log('  ❌ No picks found for Week 2');
        continue;
      }

      console.log(`  📊 Status: ${pickSet.status}`);
      console.log(`  📅 Submitted: ${pickSet.submittedAtUtc || 'Not submitted'}`);
      console.log(`  🔒 Locked: ${pickSet.lockedAtUtc || 'Not locked'}`);
      console.log(`  🎲 Tiebreaker: ${pickSet.tiebreakerScore || 'None'}`);
      console.log(`  🏈 Picks (${pickSet.picks.length}):`);

      pickSet.picks.forEach(pick => {
        const game = pick.game;
        const teamPicked = pick.choice === 'home' ? game.homeTeam : game.awayTeam;
        const spread = pick.spreadAtPick;
        const status = pick.status;
        const result = pick.result || 'pending';
        const gameStatus = game.completed ? `FINAL: ${game.awayTeam} ${game.awayScore} - ${game.homeScore} ${game.homeTeam}` : 'Not played';

        console.log(`    - ${game.awayTeam} @ ${game.homeTeam}`);
        console.log(`      Picked: ${teamPicked} (${spread > 0 ? '+' : ''}${spread})`);
        console.log(`      Status: ${status} (${result})`);
        console.log(`      Game: ${gameStatus}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStephenLennonWeek2();