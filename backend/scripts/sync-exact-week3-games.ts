import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncExactWeek3Games() {
  console.log('🏈 Syncing exact Week 3 games to match frontend...\n');

  try {
    // First, delete all Week 3 games (but preserve Week 1 & 2)
    console.log('🗑️ Removing existing Week 3 games...');
    await prisma.gameLine.deleteMany({
      where: {
        game: { weekId: '2025-W3' }
      }
    });
    await prisma.game.deleteMany({
      where: { weekId: '2025-W3' }
    });

    // Exact frontend hardcoded games - matching frontend exactly
    const exactFrontendGames = [
      {
        id: 'week3-1',
        home: 'Pittsburgh Steelers',
        away: 'New England Patriots',
        spread: -1.5,
        time: '2025-09-21T18:01:00Z'
      },
      {
        id: 'week3-2',
        home: 'Los Angeles Rams',
        away: 'Philadelphia Eagles',
        spread: 3.5,
        time: '2025-09-21T18:01:00Z'
      },
      {
        id: 'week3-3',
        home: 'Green Bay Packers',
        away: 'Cleveland Browns',
        spread: -7.5,
        time: '2025-09-21T18:01:00Z'
      },
      {
        id: 'week3-4',
        home: 'Las Vegas Raiders',
        away: 'Washington Commanders',
        spread: 3.5,
        time: '2025-09-21T18:01:00Z'
      },
      {
        id: 'week3-5',
        home: 'Cincinnati Bengals',
        away: 'Minnesota Vikings',
        spread: -3.5,
        time: '2025-09-21T18:01:00Z'
      },
      {
        id: 'week3-6',
        home: 'New York Jets',
        away: 'Tampa Bay Buccaneers',
        spread: 6.5,
        time: '2025-09-21T18:01:00Z'
      },
      {
        id: 'week3-7',
        home: 'Indianapolis Colts',
        away: 'Tennessee Titans',
        spread: -4.5,
        time: '2025-09-21T18:01:00Z'
      },
      {
        id: 'week3-8',
        home: 'Houston Texans',
        away: 'Jacksonville Jaguars',
        spread: 2.5,
        time: '2025-09-21T18:01:00Z'
      },
      {
        id: 'week3-9',
        home: 'New Orleans Saints',
        away: 'Seattle Seahawks',
        spread: 2.5,
        time: '2025-09-21T18:01:00Z'
      },
      {
        id: 'week3-10',
        home: 'Arizona Cardinals',
        away: 'San Francisco 49ers',
        spread: 2.5,
        time: '2025-09-21T21:26:00Z'
      },
      {
        id: 'week3-11',
        home: 'Kansas City Chiefs',
        away: 'New York Giants',
        spread: -5.5,
        time: '2025-09-22T01:21:00Z'
      },
      {
        id: 'week3-12',
        home: 'Detroit Lions',
        away: 'Baltimore Ravens',
        spread: 5.5,
        time: '2025-09-23T01:16:00Z'
      },
      {
        id: 'week3-13',
        home: 'Denver Broncos',
        away: 'Los Angeles Chargers',
        spread: 2.5,
        time: '2025-09-21T21:06:00Z'
      }
    ];

    console.log(`➕ Adding ${exactFrontendGames.length} exact frontend games...\n`);

    for (const game of exactFrontendGames) {
      console.log(`Creating: ${game.away} @ ${game.home} (${game.id})`);

      // Create game
      await prisma.game.create({
        data: {
          id: game.id,
          startAtUtc: new Date(game.time),
          weekId: '2025-W3',
          homeTeam: game.home,
          awayTeam: game.away,
          homeScore: null,
          awayScore: null,
          completed: false
        }
      });

      // Create game line
      await prisma.gameLine.create({
        data: {
          gameId: game.id,
          spread: game.spread,
          source: 'manual',
          fetchedAtUtc: new Date()
        }
      });

      console.log(`   ✅ Added with spread: ${game.spread}`);
    }

    // Verify final state
    const week1Count = await prisma.game.count({ where: { weekId: '2025-W1' } });
    const week2Count = await prisma.game.count({ where: { weekId: '2025-W2' } });
    const week3Count = await prisma.game.count({ where: { weekId: '2025-W3' } });

    console.log(`\n🎯 SYNC COMPLETE!`);
    console.log(`   Week 1: ${week1Count} games (preserved)`);
    console.log(`   Week 2: ${week2Count} games (preserved)`);
    console.log(`   Week 3: ${week3Count} games (exact frontend match)`);

  } catch (error) {
    console.error('❌ Error syncing games:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncExactWeek3Games().catch(console.error);