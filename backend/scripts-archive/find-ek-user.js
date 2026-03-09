const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findEKUser() {
  console.log('🔍 Looking for EK user and checking Week 3 picks...\n');

  try {
    // Find user with EK in username or email
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: 'EK', mode: 'insensitive' } },
          { username: { contains: 'ek', mode: 'insensitive' } },
          { email: { contains: 'EK', mode: 'insensitive' } },
          { email: { contains: 'ek', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`📊 Found ${users.length} users matching 'EK':`);
    users.forEach(user => {
      console.log(`   ${user.id}: ${user.username || user.email} (${user.firstName || ''} ${user.lastName || ''})`);
    });

    // Check Week 3 pick sets for each user
    for (const user of users) {
      const pickSet = await prisma.pickSet.findFirst({
        where: {
          userId: user.id,
          weekId: '2025-W3'
        },
        include: {
          picks: true
        }
      });

      console.log(`\n📋 Week 3 picks for ${user.username || user.email}:`);
      if (pickSet) {
        console.log(`   Pick set ID: ${pickSet.id}`);
        console.log(`   Pick set status: ${pickSet.status}`);
        console.log(`   Current picks: ${pickSet.picks.length}`);
        if (pickSet.picks.length > 0) {
          console.log('   Existing picks:');
          pickSet.picks.forEach(pick => {
            console.log(`     - Game ${pick.gameId}: ${pick.choice} (${pick.status})`);
          });
        }
      } else {
        console.log('   ❌ No Week 3 pick set found - need to create one');
      }
    }

    // Also show games for Titans, Browns, Panthers
    console.log('\n🏈 Looking for Titans, Browns, Panthers games:');

    const targetGames = await prisma.game.findMany({
      where: {
        weekId: '2025-W3',
        OR: [
          { homeTeam: { contains: 'Titans' } },
          { awayTeam: { contains: 'Titans' } },
          { homeTeam: { contains: 'Browns' } },
          { awayTeam: { contains: 'Browns' } },
          { homeTeam: { contains: 'Panthers' } },
          { awayTeam: { contains: 'Panthers' } }
        ]
      }
    });

    targetGames.forEach(game => {
      console.log(`   ${game.id}: ${game.awayTeam} @ ${game.homeTeam} (${game.awayScore}-${game.homeScore})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findEKUser();