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
    const apiKey = process.env.VITE_ODDS_API_KEY || "5aa0a3d280740ab65185d78b950d7c02";
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
      console.log('⚠️ API request failed, using Week 3 fallback games to match frontend');
      // Week 3 hardcoded games - must match frontend exactly
      apiGames = [
        {
          id: 'week3-1',
          home_team: 'Pittsburgh Steelers',
          away_team: 'New England Patriots',
          commence_time: '2025-09-21T18:01:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'Pittsburgh Steelers', point: -1.5 }] }] }]
        },
        {
          id: 'week3-2',
          home_team: 'Los Angeles Rams',
          away_team: 'Philadelphia Eagles',
          commence_time: '2025-09-21T18:01:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'Los Angeles Rams', point: 3.5 }] }] }]
        },
        {
          id: 'week3-3',
          home_team: 'Green Bay Packers',
          away_team: 'Cleveland Browns',
          commence_time: '2025-09-21T18:01:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'Green Bay Packers', point: -7.5 }] }] }]
        },
        {
          id: 'week3-4',
          home_team: 'Las Vegas Raiders',
          away_team: 'Washington Commanders',
          commence_time: '2025-09-21T18:01:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'Las Vegas Raiders', point: 3.5 }] }] }]
        },
        {
          id: 'week3-5',
          home_team: 'Cincinnati Bengals',
          away_team: 'Minnesota Vikings',
          commence_time: '2025-09-21T18:01:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'Cincinnati Bengals', point: -3.5 }] }] }]
        },
        {
          id: 'week3-6',
          home_team: 'New York Jets',
          away_team: 'Tampa Bay Buccaneers',
          commence_time: '2025-09-21T18:01:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'New York Jets', point: 6.5 }] }] }]
        },
        {
          id: 'week3-7',
          home_team: 'Indianapolis Colts',
          away_team: 'Tennessee Titans',
          commence_time: '2025-09-21T18:01:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'Indianapolis Colts', point: -4.5 }] }] }]
        },
        {
          id: 'week3-8',
          home_team: 'Houston Texans',
          away_team: 'Jacksonville Jaguars',
          commence_time: '2025-09-21T18:01:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'Houston Texans', point: 2.5 }] }] }]
        },
        {
          id: 'week3-9',
          home_team: 'New Orleans Saints',
          away_team: 'Seattle Seahawks',
          commence_time: '2025-09-21T18:01:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'New Orleans Saints', point: 2.5 }] }] }]
        },
        {
          id: 'week3-10',
          home_team: 'Arizona Cardinals',
          away_team: 'San Francisco 49ers',
          commence_time: '2025-09-21T21:26:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'Arizona Cardinals', point: 2.5 }] }] }]
        },
        {
          id: 'week3-11',
          home_team: 'Kansas City Chiefs',
          away_team: 'New York Giants',
          commence_time: '2025-09-22T01:21:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'Kansas City Chiefs', point: -5.5 }] }] }]
        },
        {
          id: 'week3-12',
          home_team: 'Detroit Lions',
          away_team: 'Baltimore Ravens',
          commence_time: '2025-09-23T01:16:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'Detroit Lions', point: 5.5 }] }] }]
        },
        {
          id: 'week3-13',
          home_team: 'Denver Broncos',
          away_team: 'Los Angeles Chargers',
          commence_time: '2025-09-21T21:06:00Z',
          bookmakers: [{ markets: [{ key: 'spreads', outcomes: [{ name: 'Denver Broncos', point: 2.5 }] }] }]
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
    
    console.log('🚫 Data clearing DISABLED - preserving all existing picks and games');
    console.log('   Manual entries will not be deleted on server restart');
    // All clearing operations disabled to preserve manually entered data
    
    console.log('💾 Syncing games to database...');
    
    for (const apiGame of apiGames) {
      const gameData = {
        id: apiGame.id,
        startAtUtc: new Date(apiGame.commence_time),
        weekId: '2025-W3', // Force Week 3 to match frontend
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