import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function createWeek3Games() {
  console.log('🎯 === CREATING WEEK 3 NFL GAMES ===\n');

  // Hard-coded Week 3 games with fixed spreads
  const games = [
    {
      id: "week3-1",
      home: "Pittsburgh Steelers",
      away: "New England Patriots", 
      spread: -1.5
    },
    {
      id: "week3-2",
      home: "Los Angeles Rams",
      away: "Philadelphia Eagles",
      spread: +3.5
    },
    {
      id: "week3-3",
      home: "Green Bay Packers",
      away: "Cleveland Browns",
      spread: -7.5
    },
    {
      id: "week3-4",
      home: "Las Vegas Raiders",
      away: "Washington Commanders",
      spread: +3.5
    },
    {
      id: "week3-5",
      home: "Cincinnati Bengals", 
      away: "Minnesota Vikings",
      spread: -3.5
    },
    {
      id: "week3-6",
      home: "New York Jets",
      away: "Tampa Bay Buccaneers",
      spread: +6.5
    },
    {
      id: "week3-7",
      home: "Indianapolis Colts",
      away: "Tennessee Titans", 
      spread: -4.5
    },
    {
      id: "week3-8",
      home: "Houston Texans",
      away: "Jacksonville Jaguars",
      spread: +2.5
    },
    {
      id: "week3-9",
      home: "New Orleans Saints",
      away: "Seattle Seahawks",
      spread: +2.5
    },
    {
      id: "week3-10",
      home: "Arizona Cardinals",
      away: "San Francisco 49ers",
      spread: +2.5
    },
    {
      id: "week3-11",
      home: "Kansas City Chiefs", 
      away: "New York Giants",
      spread: -5.5
    },
    {
      id: "week3-12",
      home: "Detroit Lions",
      away: "Baltimore Ravens",
      spread: +5.5
    },
    {
      id: "week3-13",
      home: "Denver Broncos",
      away: "Los Angeles Chargers",
      spread: +2.5
    }
  ];

  // Clear existing Week 3 games first
  console.log('Clearing existing Week 3 data...');
  await prisma.pick.deleteMany({
    where: { pickSet: { weekId: '2025-W3' } }
  });
  await prisma.pickSet.deleteMany({
    where: { weekId: '2025-W3' }
  });
  await prisma.gameLine.deleteMany({
    where: { game: { weekId: '2025-W3' } }
  });
  await prisma.game.deleteMany({
    where: { weekId: '2025-W3' }
  });

  // Create all games
  for (const gameData of games) {
    // Create game
    const game = await prisma.game.create({
      data: {
        id: gameData.id,
        weekId: '2025-W3',
        homeTeam: gameData.home,
        awayTeam: gameData.away,
        completed: false,
        homeScore: null,
        awayScore: null,
        startAtUtc: new Date('2025-09-21T18:00:00Z') // Default start time
      }
    });

    // Create game line with the spread
    await prisma.gameLine.create({
      data: {
        gameId: game.id,
        source: 'manual',
        spread: gameData.spread,
        fetchedAtUtc: new Date()
      }
    });

    console.log(`✅ Created: ${gameData.away} @ ${gameData.home} (${gameData.spread > 0 ? '+' : ''}${gameData.spread})`);
  }

  console.log(`\n🎯 Successfully created ${games.length} Week 3 games with spreads!`);
  
  await prisma.$disconnect();
}

createWeek3Games().catch(console.error);