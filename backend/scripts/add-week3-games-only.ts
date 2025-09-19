import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addWeek3GamesOnly() {
  console.log('🏈 Adding Week 3 games only (preserving Week 1 & 2 data)...');

  try {
    // Week 3 hardcoded games - must match frontend exactly
    const week3Games = [
      {
        id: 'week3-1',
        home_team: 'Pittsburgh Steelers',
        away_team: 'New England Patriots',
        commence_time: '2025-09-21T18:01:00Z',
        spread: -1.5
      },
      {
        id: 'week3-2',
        home_team: 'Los Angeles Rams',
        away_team: 'Philadelphia Eagles',
        commence_time: '2025-09-21T18:01:00Z',
        spread: 3.5
      },
      {
        id: 'week3-3',
        home_team: 'Green Bay Packers',
        away_team: 'Cleveland Browns',
        commence_time: '2025-09-21T18:01:00Z',
        spread: -7.5
      },
      {
        id: 'week3-4',
        home_team: 'Las Vegas Raiders',
        away_team: 'Washington Commanders',
        commence_time: '2025-09-21T18:01:00Z',
        spread: 3.5
      },
      {
        id: 'week3-5',
        home_team: 'Cincinnati Bengals',
        away_team: 'Minnesota Vikings',
        commence_time: '2025-09-21T18:01:00Z',
        spread: -3.5
      },
      {
        id: 'week3-6',
        home_team: 'New York Jets',
        away_team: 'Tampa Bay Buccaneers',
        commence_time: '2025-09-21T18:01:00Z',
        spread: 6.5
      },
      {
        id: 'week3-7',
        home_team: 'Indianapolis Colts',
        away_team: 'Tennessee Titans',
        commence_time: '2025-09-21T18:01:00Z',
        spread: -4.5
      },
      {
        id: 'week3-8',
        home_team: 'Houston Texans',
        away_team: 'Jacksonville Jaguars',
        commence_time: '2025-09-21T18:01:00Z',
        spread: 2.5
      },
      {
        id: 'week3-9',
        home_team: 'New Orleans Saints',
        away_team: 'Seattle Seahawks',
        commence_time: '2025-09-21T18:01:00Z',
        spread: 2.5
      },
      {
        id: 'week3-10',
        home_team: 'Arizona Cardinals',
        away_team: 'San Francisco 49ers',
        commence_time: '2025-09-21T21:26:00Z',
        spread: 2.5
      },
      {
        id: 'week3-11',
        home_team: 'Kansas City Chiefs',
        away_team: 'New York Giants',
        commence_time: '2025-09-22T01:21:00Z',
        spread: -5.5
      },
      {
        id: 'week3-12',
        home_team: 'Detroit Lions',
        away_team: 'Baltimore Ravens',
        commence_time: '2025-09-23T01:16:00Z',
        spread: 5.5
      },
      {
        id: 'week3-13',
        home_team: 'Denver Broncos',
        away_team: 'Los Angeles Chargers',
        commence_time: '2025-09-21T21:06:00Z',
        spread: 2.5
      }
    ];

    console.log(`📊 Processing ${week3Games.length} Week 3 games...`);

    for (const game of week3Games) {
      // Check if game already exists
      const existingGame = await prisma.game.findFirst({
        where: { id: game.id }
      });

      if (existingGame) {
        console.log(`✅ Game ${game.id} already exists - skipping`);
        continue;
      }

      console.log(`🆕 Creating game: ${game.away_team} @ ${game.home_team}`);

      // Create game
      await prisma.game.create({
        data: {
          id: game.id,
          startAtUtc: new Date(game.commence_time),
          weekId: '2025-W3',
          homeTeam: game.home_team,
          awayTeam: game.away_team,
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

    // Verify Week 3 games exist
    const week3Count = await prisma.game.count({
      where: { weekId: '2025-W3' }
    });

    console.log(`🎯 SUCCESS! Week 3 now has ${week3Count} games`);

    // Verify Week 1 & 2 data is preserved
    const week1Count = await prisma.game.count({
      where: { weekId: '2025-W1' }
    });
    const week2Count = await prisma.game.count({
      where: { weekId: '2025-W2' }
    });

    console.log(`📈 Data preservation check:`);
    console.log(`   Week 1: ${week1Count} games`);
    console.log(`   Week 2: ${week2Count} games`);
    console.log(`   Week 3: ${week3Count} games`);

  } catch (error) {
    console.error('❌ Error adding Week 3 games:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addWeek3GamesOnly().catch(console.error);