const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const count = await prisma.user.count();
    console.log('Total users in database:', count);
    
    if (count > 0) {
      const users = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          createdAt: true
        }
      });
      console.log('\nRecent users:');
      users.forEach(user => {
        console.log(`- ${user.email} (${user.username}) - Created: ${user.createdAt}`);
      });
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
