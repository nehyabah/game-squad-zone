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

  async getGames(season: number = 2023): Promise<Game[]> {
    console.log('Attempting to fetch games for season:', season);
    try {
      // Try different endpoints to find upcoming games
      let data = await this.makeRequest(`/games?league=1&season=${season}`);
      console.log('API response:', data);
      
      // If no games or error, try without season parameter
      if (!data.response || data.response.length === 0 || data.errors) {
        console.log('Trying alternative endpoint...');
        data = await this.makeRequest('/games?league=1');
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

      if (upcomingGames.length === 0) {
        console.log('No upcoming games found, using fallback');
        return this.getFallbackGames();
      }

      console.log(`Found ${upcomingGames.length} upcoming games`);
      return upcomingGames;
    } catch (error) {
      console.error('API request failed, using fallback games:', error);
      return this.getFallbackGames();
    }
  }

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

  private calculateSpread(apiGame: any): number {
    // This would need to be adapted based on the actual API response structure
    // For now, return a random spread between -7 and 7
    return Math.round((Math.random() - 0.5) * 14 * 2) / 2;
  }

  private getFallbackGames(): Game[] {
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

    return [
      {
        id: "1",
        homeTeam: {
          id: 1,
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
        season: 2023
      },
      {
        id: "2",
        homeTeam: {
          id: 3,
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
        season: 2023
      },
      {
        id: "3",
        homeTeam: {
          id: 5,
          name: "Pittsburgh Steelers",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png",
          code: "PIT"
        },
        awayTeam: {
          id: 6,
          name: "Cleveland Browns",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png",
          code: "CLE"
        },
        spread: -3.0,
        time: getUpcomingNFLSunday(1),
        week: 2,
        season: 2023
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
          name: "Green Bay Packers",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png",
          code: "GB"
        },
        spread: -2.0,
        time: getUpcomingNFLSunday(1),
        week: 2,
        season: 2023
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
        season: 2023
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
        season: 2023
      }
    ];
  }
}

export const nflApi = new NFLApiService();
export type { Game, Team };