import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateWeek3GamesToMatchFrontend() {
  console.log('🏈 Updating Week 3 games to match frontend exactly...\n');

  try {
    // Exact frontend games mapping
    const frontendGameMapping = {
      'week3-1': {
        homeTeam: 'Pittsburgh Steelers',
        awayTeam: 'New England Patriots',
        spread: -1.5,
        startAtUtc: new Date('2025-09-21T18:01:00Z')
      },
      'week3-2': {
        homeTeam: 'Los Angeles Rams',
        awayTeam: 'Philadelphia Eagles',
        spread: 3.5,
        startAtUtc: new Date('2025-09-21T18:01:00Z')
      },
      'week3-3': {
        homeTeam: 'Green Bay Packers',
        awayTeam: 'Cleveland Browns',
        spread: -7.5,
        startAtUtc: new Date('2025-09-21T18:01:00Z')
      },
      'week3-4': {
        homeTeam: 'Las Vegas Raiders',
        awayTeam: 'Washington Commanders',
        spread: 3.5,
        startAtUtc: new Date('2025-09-21T18:01:00Z')
      },
      'week3-5': {
        homeTeam: 'Cincinnati Bengals',
        awayTeam: 'Minnesota Vikings',
        spread: -3.5,
        startAtUtc: new Date('2025-09-21T18:01:00Z')
      },
      'week3-6': {
        homeTeam: 'New York Jets',
        awayTeam: 'Tampa Bay Buccaneers',
        spread: 6.5,
        startAtUtc: new Date('2025-09-21T18:01:00Z')
      },
      'week3-7': {
        homeTeam: 'Indianapolis Colts',
        awayTeam: 'Tennessee Titans',
        spread: -4.5,
        startAtUtc: new Date('2025-09-21T18:01:00Z')
      },
      'week3-8': {
        homeTeam: 'Houston Texans',
        awayTeam: 'Jacksonville Jaguars',
        spread: 2.5,
        startAtUtc: new Date('2025-09-21T18:01:00Z')
      },
      'week3-9': {
        homeTeam: 'New Orleans Saints',
        awayTeam: 'Seattle Seahawks',
        spread: 2.5,
        startAtUtc: new Date('2025-09-21T18:01:00Z')
      },
      'week3-10': {
        homeTeam: 'Arizona Cardinals',
        awayTeam: 'San Francisco 49ers',
        spread: 2.5,
        startAtUtc: new Date('2025-09-21T21:26:00Z')
      },
      'week3-11': {
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'New York Giants',
        spread: -5.5,
        startAtUtc: new Date('2025-09-22T01:21:00Z')
      },
      'week3-12': {
        homeTeam: 'Detroit Lions',
        awayTeam: 'Baltimore Ravens',
        spread: 5.5,
        startAtUtc: new Date('2025-09-23T01:16:00Z')
      },
      'week3-13': {
        homeTeam: 'Denver Broncos',
        awayTeam: 'Los Angeles Chargers',
        spread: 2.5,
        startAtUtc: new Date('2025-09-21T21:06:00Z')
      }
    };

    console.log('🔄 Updating existing games to match frontend...\n');

    for (const [gameId, gameData] of Object.entries(frontendGameMapping)) {
      const existingGame = await prisma.game.findFirst({
        where: { id: gameId },
        include: { lines: true }
      });

      if (!existingGame) {
        console.log(`❌ Game ${gameId} not found, creating new one...`);

        // Create new game
        await prisma.game.create({
          data: {
            id: gameId,
            startAtUtc: gameData.startAtUtc,
            weekId: '2025-W3',
            homeTeam: gameData.homeTeam,
            awayTeam: gameData.awayTeam,
            homeScore: null,
            awayScore: null,
            completed: false
          }
        });

        // Create game line
        await prisma.gameLine.create({
          data: {
            gameId: gameId,
            spread: gameData.spread,
            source: 'manual',
            fetchedAtUtc: new Date()
          }
        });

        console.log(`   ✅ Created: ${gameData.awayTeam} @ ${gameData.homeTeam}`);
        continue;
      }

      // Update existing game
      console.log(`🔄 Updating game ${gameId}:`);
      console.log(`   From: ${existingGame.awayTeam} @ ${existingGame.homeTeam}`);
      console.log(`   To:   ${gameData.awayTeam} @ ${gameData.homeTeam}`);

      await prisma.game.update({
        where: { id: gameId },
        data: {
          homeTeam: gameData.homeTeam,
          awayTeam: gameData.awayTeam,
          startAtUtc: gameData.startAtUtc
        }
      });

      // Update or create game line
      if (existingGame.lines.length > 0) {
        await prisma.gameLine.update({
          where: { id: existingGame.lines[0].id },
          data: {
            spread: gameData.spread,
            fetchedAtUtc: new Date()
          }
        });
      } else {
        await prisma.gameLine.create({
          data: {
            gameId: gameId,
            spread: gameData.spread,
            source: 'manual',
            fetchedAtUtc: new Date()
          }
        });
      }

      console.log(`   ✅ Updated with spread: ${gameData.spread}`);
    }

    console.log('\n🎯 UPDATE COMPLETE! Games now match frontend exactly.');
    console.log('📈 Existing user picks have been preserved.');

  } catch (error) {
    console.error('❌ Error updating games:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateWeek3GamesToMatchFrontend().catch(console.error);