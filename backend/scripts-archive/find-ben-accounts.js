const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findBenAccounts() {
  console.log('🔍 Finding Ben accounts (benkidd2015@gmail.com)...\n');

  try {
    // Find all users with Ben/benkidd variations
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'benkidd2015@gmail.com' } },
          { email: { contains: 'benkidd' } },
          { username: { contains: 'ben', mode: 'insensitive' } },
          { username: { contains: 'kidd', mode: 'insensitive' } }
        ]
      },
      include: {
        pickSets: {
          include: {
            picks: true
          },
          orderBy: {
            weekId: 'asc'
          }
        }
      }
    });

    console.log(`📊 Found ${users.length} potential Ben accounts:\n`);

    for (const user of users) {
      console.log(`👤 User: ${user.username || 'no username'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Pick Sets: ${user.pickSets.length}`);

      if (user.pickSets.length > 0) {
        console.log('   Week breakdown:');
        user.pickSets.forEach(pickSet => {
          console.log(`     Week ${pickSet.weekId}: ${pickSet.picks.length} picks (${pickSet.status})`);
        });
      } else {
        console.log('   No pick sets found');
      }
      console.log('');
    }

    // Show summary of what needs to be done
    console.log('📋 Summary for consolidation:');

    const account1 = users.find(u => u.pickSets.some(ps => ['2025-W1', '2025-W2'].includes(ps.weekId)));
    const account2 = users.find(u => u.pickSets.some(ps => ps.weekId === '2025-W3'));

    if (account1) {
      console.log(`Account 1 (${account1.email}): Has weeks 1 & 2`);
      console.log(`  - Week 1: ${account1.pickSets.find(ps => ps.weekId === '2025-W1')?.picks.length || 0} picks`);
      console.log(`  - Week 2: ${account1.pickSets.find(ps => ps.weekId === '2025-W2')?.picks.length || 0} picks`);
    }

    if (account2) {
      console.log(`Account 2 (${account2.email}): Has week 3`);
      console.log(`  - Week 3: ${account2.pickSets.find(ps => ps.weekId === '2025-W3')?.picks.length || 0} picks`);
    }

    console.log('\n🎯 Action needed:');
    if (account1 && account2) {
      console.log('1. Copy Week 3 picks from Account 2 to Account 1');
      console.log('2. Copy Week 1 & 2 picks from Account 1 to Account 2');
    } else {
      console.log('Could not identify the two distinct accounts clearly');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findBenAccounts();