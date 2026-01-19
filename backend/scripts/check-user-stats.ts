import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserStats(username: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { email: { contains: username, mode: 'insensitive' } },
        ]
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('✅ User:', user.username);
    console.log('📧 Email:', user.email);

    // Get all picks
    const allPicks = await prisma.pick.findMany({
      where: {
        pickSet: {
          userId: user.id
        }
      },
      include: {
        pickSet: true
      }
    });

    console.log('\n📊 Total picks:', allPicks.length);

    // Count by result
    const wins = allPicks.filter(p => p.result === 'win').length;
    const losses = allPicks.filter(p => p.result === 'loss').length;
    const pending = allPicks.filter(p => p.result === null || p.status === 'pending').length;
    const push = allPicks.filter(p => p.result === 'push').length;

    console.log('✅ Wins:', wins);
    console.log('❌ Losses:', losses);
    console.log('➖ Pushes:', push);
    console.log('⏳ Pending:', pending);

    // Check penalty picks specifically
    const penaltyPicks = allPicks.filter(p => p.lineSource === 'penalty');
    console.log('\n🚨 Penalty picks:', penaltyPicks.length);
    console.log('❌ Penalty losses:', penaltyPicks.filter(p => p.result === 'loss').length);

    // Calculate total payout
    const totalPayout = allPicks.reduce((sum, p) => sum + (p.payout || 0), 0);
    console.log('\n💰 Total payout:', totalPayout.toFixed(2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const username = process.argv[2] || 'Eoin';
checkUserStats(username);
