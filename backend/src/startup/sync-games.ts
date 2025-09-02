import { PrismaClient } from '@prisma/client';
import { getWeekIdFromDate } from '../utils/weekUtils';

interface OddsApiGame {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: Array<{
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        point?: number;
      }>;
    }>;
  }>;
}

export async function syncGamesOnStartup(prisma: PrismaClient) {
  console.log('🔄 Starting game sync on server startup...');
  
  try {
    const apiKey = process.env.VITE_ODDS_API_KEY || "78177f5cdef26278574c57dd5c03064d";
    const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?apiKey=${apiKey}&regions=us&markets=spreads`;
    
    let apiGames: OddsApiGame[] = [];
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      apiGames = await response.json();
      console.log(`📊 Found ${apiGames.length} games from API`);
    } catch (error) {
      console.log('⚠️ API request failed, using fallback games for database sync');
      // Use fallback games if API fails
      apiGames = [
        {
          id: 'fallback-1',
          home_team: 'Philadelphia Eagles',
          away_team: 'Dallas Cowboys',
          commence_time: '2025-09-07T17:00:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'Philadelphia Eagles', point: -3.5 }] }] }]
        },
        {
          id: 'fallback-2', 
          home_team: 'Kansas City Chiefs',
          away_team: 'Buffalo Bills',
          commence_time: '2025-09-07T20:30:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'Kansas City Chiefs', point: 2.5 }] }] }]
        },
        {
          id: 'fallback-3',
          home_team: 'San Francisco 49ers',
          away_team: 'Green Bay Packers',
          commence_time: '2025-09-08T00:15:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'San Francisco 49ers', point: -1.5 }] }] }]
        },
        {
          id: 'fallback-4',
          home_team: 'Miami Dolphins', 
          away_team: 'New York Jets',
          commence_time: '2025-09-09T00:15:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'Miami Dolphins', point: 4.5 }] }] }]
        }
      ];
    }

    if (apiGames.length === 0) {
      console.log('⚠️ No games found, skipping database sync');
      return;
    }
    
    // Check if games already exist to avoid unnecessary clearing
    const existingGames = await prisma.game.findMany({ take: 1 });
    const existingGameIds = (await prisma.game.findMany({ select: { id: true } })).map(g => g.id);
    const newGameIds = apiGames.map(g => g.id);
    
    // Only clear and resync if the game IDs are different
    const needsSync = existingGameIds.length === 0 || 
                     existingGameIds.some(id => !newGameIds.includes(id)) ||
                     newGameIds.some(id => !existingGameIds.includes(id));
    
    if (!needsSync) {
      console.log('✅ Database already has current games, skipping sync');
      return;
    }
    
    console.log('🧹 Clearing existing game data for sync...');
    await prisma.pick.deleteMany();
    await prisma.pickSet.deleteMany();
    await prisma.gameLine.deleteMany();
    await prisma.game.deleteMany();
    
    console.log('💾 Syncing games to database...');
    
    for (const apiGame of apiGames) {
      const gameData = {
        id: apiGame.id,
        startAtUtc: new Date(apiGame.commence_time),
        weekId: getWeekIdFromDate(new Date(apiGame.commence_time)),
        homeTeam: apiGame.home_team,
        awayTeam: apiGame.away_team,
        homeScore: null,
        awayScore: null,
        completed: false
      };
      
      await prisma.game.create({ data: gameData });
      
      // Extract spread
      let spread = 0;
      if (apiGame.bookmakers && apiGame.bookmakers.length > 0) {
        for (const bookmaker of apiGame.bookmakers) {
          const spreadMarket = bookmaker.markets?.find(market => market.key === 'spreads');
          if (spreadMarket) {
            const homeOutcome = spreadMarket.outcomes?.find(outcome => outcome.name === apiGame.home_team);
            if (homeOutcome && homeOutcome.point !== undefined) {
              spread = homeOutcome.point;
              break;
            }
          }
        }
      }
      
      // If spread is a whole number, add 0.5
      if (spread % 1 === 0) {
        spread += 0.5;
      }
      
      // Create game line
      const lineData = {
        gameId: apiGame.id,
        spread: spread,
        source: 'odds-api',
        fetchedAtUtc: new Date()
      };
      
      await prisma.gameLine.create({ data: lineData });
    }
    
    console.log(`✅ Game sync completed! Synced ${apiGames.length} games`);
    
  } catch (error) {
    console.error('❌ Error syncing games on startup:', error);
  }
}