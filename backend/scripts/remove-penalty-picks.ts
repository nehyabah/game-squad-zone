import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removePenaltyPicks(username: string) {
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

    // Find PickSets for weeks W10, W13, W14
    const pickSets = await prisma.pickSet.findMany({
      where: {
        userId: user.id,
        weekId: {
          in: ['2025-W10', '2025-W13', '2025-W14']
        }
      },
      include: {
        picks: true
      }
    });

    console.log(`📦 Found ${pickSets.length} PickSets to remove`);

    for (const pickSet of pickSets) {
      console.log(`\n🗑️  Deleting PickSet for week ${pickSet.weekId}...`);

      // Delete all picks in this PickSet
      await prisma.pick.deleteMany({
        where: { pickSetId: pickSet.id }
      });
      console.log(`   ✅ Deleted ${pickSet.picks.length} picks`);

      // Delete the PickSet
      await prisma.pickSet.delete({
        where: { id: pickSet.id }
      });
      console.log(`   ✅ Deleted PickSet`);
    }

    console.log(`\n✅ Removed all penalty picks for ${user.username}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const username = process.argv[2];

if (!username) {
  console.log('Usage: ts-node remove-penalty-picks.ts <username>');
  process.exit(1);
}

removePenaltyPicks(username);
