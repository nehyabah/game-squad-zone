interface Team {
  id: number;
  name: string;
  logo: string;
  code: string;
}

interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  spread: number;
  time: string;
  week: number;
  season: number;
}

class NFLApiService {
  private baseUrl = 'https://v1.american-football.api-sports.io';
  private apiKey: string | null = null;

  constructor() {
    // Use the provided API key directly
    this.apiKey = '3c0e011b07d02537bbbb1ce5e26227e3';
  }

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('nfl_api_key', key);
  }

  private async makeRequest(endpoint: string) {
    if (!this.apiKey) {
      throw new Error('API key not set');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': 'v1.american-football.api-sports.io',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getTeams(): Promise<Team[]> {
    try {
      const data = await this.makeRequest('/teams');
      return data.response || [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }

<<<<<<< HEAD
  async getGames(season: number = 2023, week: number = 1): Promise<Game[]> {
    console.log('Attempting to fetch games...');
    try {
      const data = await this.makeRequest(`/games?league=1&season=${season}&week=${week}`);
      console.log('API response:', data);
      
      // Transform API response to our Game interface
      const games = data.response?.map((apiGame: any) => ({
        id: apiGame.game.id.toString(),
        homeTeam: {
          id: apiGame.teams.home.id,
          name: apiGame.teams.home.name,
          logo: apiGame.teams.home.logo,
          code: apiGame.teams.home.code,
        },
        awayTeam: {
          id: apiGame.teams.away.id,
          name: apiGame.teams.away.name,
          logo: apiGame.teams.away.logo,
          code: apiGame.teams.away.code,
        },
        spread: this.calculateSpread(apiGame),
        time: new Date(apiGame.game.date.date).toLocaleString(),
        week: apiGame.game.week,
        season: apiGame.game.season,
      })) || [];

      if (games.length === 0) {
        console.log('No games returned from API, using fallback');
        return this.getFallbackGames();
      }

      return games;
    } catch (error) {
      console.error('API request failed (likely CORS), using fallback games:', error);
=======
  async getGames(season: number = 2025): Promise<Game[]> {
    console.log('Attempting to fetch games for season:', season);
    try {
      // Try to get current/upcoming games for 2025 season
      let data = await this.makeRequest(`/games?league=1&season=${season}`);
      console.log('API response:', data);
      
      // If no 2025 games, try getting current week's games
      if (!data.response || data.response.length === 0 || data.errors) {
        console.log('Trying current games endpoint...');
        data = await this.makeRequest('/games?league=1&current=true');
      }
      
      // If still no data, try live games
      if (!data.response || data.response.length === 0) {
        console.log('Trying live games endpoint...');
        data = await this.makeRequest('/games?league=1&live=all');
      }
      
      // Transform API response to our Game interface
      const games = data.response?.map((apiGame: any) => {
        // Handle different possible API response structures
        const gameData = apiGame.game || apiGame;
        const teamsData = apiGame.teams || {};
        
        return {
          id: (gameData.id || Math.random().toString()).toString(),
          homeTeam: {
            id: teamsData.home?.id || 1,
            name: teamsData.home?.name || 'Home Team',
            logo: teamsData.home?.logo || 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png',
            code: teamsData.home?.code || 'HOME',
          },
          awayTeam: {
            id: teamsData.away?.id || 2,
            name: teamsData.away?.name || 'Away Team',
            logo: teamsData.away?.logo || 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png',
            code: teamsData.away?.code || 'AWAY',
          },
          spread: this.calculateSpread(apiGame),
          time: this.formatGameTime(gameData),
          week: gameData.week || 1,
          season: gameData.season || season,
        };
      }) || [];

      // Filter for upcoming games (future dates)
      const now = new Date();
      const upcomingGames = games.filter(game => {
        try {
          const gameDate = new Date(game.time);
          return gameDate > now;
        } catch {
          return true; // Include if we can't parse date
        }
      }).slice(0, 8); // Limit to 8 upcoming games

      console.log(`Found ${games.length} total games, ${upcomingGames.length} upcoming games`);
      
      // With paid API, prioritize real data over fallbacks
      if (games.length > 0) {
        console.log('Using real API games data');
        return upcomingGames.length > 0 ? upcomingGames : games.slice(0, 8);
      }

      console.log('No games found in API, using fallback');
      return this.getFallbackGames();
    } catch (error) {
      console.error('API request failed, using fallback games:', error);
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
      return this.getFallbackGames();
    }
  }

<<<<<<< HEAD
=======
  private formatGameTime(gameData: any): string {
    if (gameData.date?.date) {
      try {
        return new Date(gameData.date.date).toLocaleString();
      } catch {
        // Fallback if date parsing fails
      }
    }
    
    // Return a placeholder time for upcoming games
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
    nextSunday.setHours(13, 0, 0, 0); // 1 PM
    return nextSunday.toLocaleString();
  }

>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
  private calculateSpread(apiGame: any): number {
    // This would need to be adapted based on the actual API response structure
    // For now, return a random spread between -7 and 7
    return Math.round((Math.random() - 0.5) * 14 * 2) / 2;
  }

  private getFallbackGames(): Game[] {
<<<<<<< HEAD
=======
    // Generate dates for upcoming NFL Sundays (September through February)
    const getUpcomingNFLSunday = (weeksAhead: number = 0) => {
      const now = new Date();
      const currentMonth = now.getMonth();
      
      // NFL season runs September (month 8) through February (month 1)
      let targetDate = new Date();
      
      // If we're before September, start from September
      if (currentMonth < 8) {
        targetDate.setMonth(8); // September
        targetDate.setDate(1);
      }
      
      // Find the next Sunday
      const daysUntilSunday = (7 - targetDate.getDay()) % 7 || 7;
      targetDate.setDate(targetDate.getDate() + daysUntilSunday + (weeksAhead * 7));
      
      // Set to typical NFL game time (1 PM or 4:25 PM ET)
      const gameHours = weeksAhead % 2 === 0 ? 13 : 16; // Alternate between 1 PM and 4 PM
      const gameMinutes = gameHours === 16 ? 25 : 0;
      targetDate.setHours(gameHours, gameMinutes, 0, 0);
      
      return targetDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    };

>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
    return [
      {
        id: "1",
        homeTeam: {
          id: 1,
<<<<<<< HEAD
          name: "New England Patriots",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png",
          code: "NE"
        },
        awayTeam: {
          id: 2,
          name: "Tampa Bay Buccaneers",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png",
          code: "TB"
        },
        spread: -3.5,
        time: "Sunday, Sep 10, 1:00 PM ET",
        week: 1,
        season: 2024
=======
          name: "Kansas City Chiefs",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
          code: "KC"
        },
        awayTeam: {
          id: 2,
          name: "Buffalo Bills",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
          code: "BUF"
        },
        spread: -2.5,
        time: getUpcomingNFLSunday(0),
        week: 2,
        season: 2025
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
      },
      {
        id: "2",
        homeTeam: {
          id: 3,
<<<<<<< HEAD
          name: "Carolina Panthers",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png",
          code: "CAR"
        },
        awayTeam: {
          id: 4,
          name: "Atlanta Falcons", 
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png",
          code: "ATL"
        },
        spread: 2.5,
        time: "Sunday, Sep 10, 1:00 PM ET",
        week: 1,
        season: 2024
=======
          name: "San Francisco 49ers",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png",
          code: "SF"
        },
        awayTeam: {
          id: 4,
          name: "Dallas Cowboys", 
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png",
          code: "DAL"
        },
        spread: -4.5,
        time: getUpcomingNFLSunday(0),
        week: 2,
        season: 2025
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
      },
      {
        id: "3",
        homeTeam: {
          id: 5,
<<<<<<< HEAD
=======
          name: "Pittsburgh Steelers",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png",
          code: "PIT"
        },
        awayTeam: {
          id: 6,
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
          name: "Cleveland Browns",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png",
          code: "CLE"
        },
<<<<<<< HEAD
        awayTeam: {
          id: 6,
          name: "Cincinnati Bengals",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png",
          code: "CIN"
        },
        spread: 5.5,
        time: "Sunday, Sep 10, 1:00 PM ET",
        week: 1,
        season: 2024
=======
        spread: -3.0,
        time: getUpcomingNFLSunday(1),
        week: 2,
        season: 2025
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
      },
      {
        id: "4",
        homeTeam: {
          id: 7,
          name: "Detroit Lions",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png",
          code: "DET"
        },
        awayTeam: {
          id: 8,
<<<<<<< HEAD
          name: "Kansas City Chiefs",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
          code: "KC"
        },
        spread: -3.5,
        time: "Sunday, Sep 10, 1:00 PM ET",
        week: 1,
        season: 2024
=======
          name: "Green Bay Packers",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png",
          code: "GB"
        },
        spread: -2.0,
        time: getUpcomingNFLSunday(1),
        week: 2,
        season: 2025
      },
      {
        id: "5",
        homeTeam: {
          id: 9,
          name: "Jacksonville Jaguars",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png",
          code: "JAX"
        },
        awayTeam: {
          id: 10,
          name: "Indianapolis Colts",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png",
          code: "IND"
        },
        spread: -1.0,
        time: getUpcomingNFLSunday(1),
        week: 2,
        season: 2025
      },
      {
        id: "6",
        homeTeam: {
          id: 11,
          name: "Los Angeles Rams",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png",
          code: "LAR"
        },
        awayTeam: {
          id: 12,
          name: "Arizona Cardinals",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png",
          code: "ARI"
        },
        spread: -5.5,
        time: getUpcomingNFLSunday(2),
        week: 2,
        season: 2025
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
      }
    ];
  }
}

export const nflApi = new NFLApiService();
export type { Game, Team };