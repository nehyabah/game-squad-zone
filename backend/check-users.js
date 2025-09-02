const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        username: true
      }
    });
    
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ${user.email}: displayName="${user.displayName}", firstName="${user.firstName}", lastName="${user.lastName}"`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();