const { PrismaClient } = require('@prisma/client');

async function checkGames() {
  const prisma = new PrismaClient();
  
  try {
    const games = await prisma.game.findMany({
      orderBy: { startAtUtc: 'asc' },
      take: 10
    });
    
    console.log('Current games in database:');
    console.log('Count:', games.length);
    
    if (games.length > 0) {
      games.forEach(game => {
        const now = new Date();
        const isLocked = now >= game.startAtUtc;
        console.log(`${game.id}: ${game.homeTeam} vs ${game.awayTeam}`);
        console.log(`  Start: ${game.startAtUtc.toISOString()}`);
        console.log(`  Locked: ${isLocked ? 'YES' : 'NO'}`);
        console.log('');
      });
    } else {
      console.log('No games found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGames();