const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function addMissingWeek3Game() {
  try {
    console.log('🏈 === ADDING MISSING WEEK 3 GAME ===');

    // Check if the game already exists
    const existingGame = await prisma.game.findFirst({
      where: { id: 'week3-13' }
    });

    if (existingGame) {
      console.log('✅ Game week3-13 already exists');
      return;
    }

    // Since we have 16 Week 3 games and need the 13th one with ID "week3-13"
    // Let's use the 13th game from our existing list (Indianapolis Colts @ Tennessee Titans)

    console.log('🆕 Creating game with ID "week3-13"...');

    const newGame = await prisma.game.create({
      data: {
        id: 'week3-13',
        startAtUtc: new Date('2025-09-22T17:00:00Z'), // Week 3 date
        weekId: '2025-W3',
        homeTeam: 'Tennessee Titans',
        awayTeam: 'Indianapolis Colts',
        homeScore: null,
        awayScore: null,
        completed: false
      }
    });

    console.log(`✅ Created game: ${newGame.awayTeam} @ ${newGame.homeTeam}`);

    // Add game line with spread
    const gameLine = await prisma.gameLine.create({
      data: {
        gameId: 'week3-13',
        spread: 4.5, // Tennessee favored by 4.5
        source: 'draftkings',
        fetchedAtUtc: new Date()
      }
    });

    console.log(`✅ Added game line with spread: ${gameLine.spread}`);

    // Verify the game exists with lines
    const verifyGame = await prisma.game.findFirst({
      where: { id: 'week3-13' },
      include: { lines: true }
    });

    if (verifyGame && verifyGame.lines.length > 0) {
      console.log('🎯 SUCCESS! Game week3-13 created with lines');
      console.log(`   Game: ${verifyGame.awayTeam} @ ${verifyGame.homeTeam}`);
      console.log(`   Spread: ${verifyGame.lines[0].spread}`);
    } else {
      console.log('❌ Verification failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingWeek3Game();