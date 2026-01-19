import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPenaltyPickStatus(username?: string) {
  try {
    let whereClause: any = {
      lineSource: 'penalty',
      status: 'graded'
    };

    // If username provided, filter by that user
    if (username) {
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

      whereClause = {
        lineSource: 'penalty',
        status: 'graded',
        pickSet: {
          userId: user.id
        }
      };
    }

    // Find all penalty picks with status 'graded'
    const penaltyPicks = await prisma.pick.findMany({
      where: whereClause,
      include: {
        pickSet: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`\n🔍 Found ${penaltyPicks.length} penalty picks with status 'graded'`);

    if (penaltyPicks.length === 0) {
      console.log('✅ No penalty picks need fixing!');
      return;
    }

    // Update all penalty picks from 'graded' to 'lost'
    const result = await prisma.pick.updateMany({
      where: whereClause,
      data: {
        status: 'lost'
      }
    });

    console.log(`\n✅ Updated ${result.count} penalty picks from status 'graded' to 'lost'`);

    // Show breakdown by user
    const userCounts: { [key: string]: number } = {};
    penaltyPicks.forEach(pick => {
      const username = pick.pickSet.user.username;
      userCounts[username] = (userCounts[username] || 0) + 1;
    });

    console.log('\n📊 Picks updated per user:');
    Object.entries(userCounts).forEach(([username, count]) => {
      console.log(`   ${username}: ${count} picks`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get username from command line argument (optional)
const username = process.argv[2];

if (username) {
  console.log(`🔄 Fixing penalty picks for user: ${username}`);
} else {
  console.log(`🔄 Fixing penalty picks for ALL users`);
}

fixPenaltyPickStatus(username);
