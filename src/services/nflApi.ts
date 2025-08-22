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
  private apiKey = '3c0e011b07d02537bbbb1ce5e26227e3'; // Your API key

  // Since the API has CORS restrictions, we'll use fallback data for now
  // In a real app, this would go through a backend proxy
  private async makeRequest(endpoint: string) {
    try {
      // This will fail due to CORS, so we'll catch and return fallback data
      const response = await fetch(`https://v1.american-football.api-sports.io${endpoint}`, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'v1.american-football.api-sports.io'
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.log('API request failed (likely CORS), using fallback data:', error);
      throw error;
    }
  }

  async getTeams(): Promise<Team[]> {
    try {
      const data = await this.makeRequest('/teams');
      return data.response || [];
    } catch (error) {
      // Return fallback teams since API has CORS issues
      return this.getFallbackTeams();
    }
  }

  private getFallbackTeams(): Team[] {
    return [
      { id: 1, name: "New England Patriots", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png", code: "NE" },
      { id: 2, name: "Tampa Bay Buccaneers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png", code: "TB" },
      { id: 3, name: "Carolina Panthers", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png", code: "CAR" },
      { id: 4, name: "Atlanta Falcons", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png", code: "ATL" },
      { id: 5, name: "Cleveland Browns", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png", code: "CLE" },
      { id: 6, name: "Cincinnati Bengals", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png", code: "CIN" },
      { id: 7, name: "Detroit Lions", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png", code: "DET" },
      { id: 8, name: "Kansas City Chiefs", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png", code: "KC" }
    ];
  }

  async getGames(season: number = 2024, week: number = 1): Promise<Game[]> {
    console.log('getGames called, attempting API request...');
    try {
      const data = await this.makeRequest(`/games?league=1&season=${season}&week=${week}`);
      
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

      console.log('API games:', games);
      return games;
    } catch (error) {
      console.log('API failed, returning fallback games');
      const fallbackGames = this.getFallbackGames();
      console.log('Fallback games:', fallbackGames);
      return fallbackGames;
    }
  }

  private calculateSpread(apiGame: any): number {
    // This would need to be adapted based on the actual API response structure
    // For now, return a random spread between -7 and 7
    return Math.round((Math.random() - 0.5) * 14 * 2) / 2;
  }

  private getFallbackGames(): Game[] {
    return [
      {
        id: "1",
        homeTeam: {
          id: 1,
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
      },
      {
        id: "2",
        homeTeam: {
          id: 3,
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
      },
      {
        id: "3",
        homeTeam: {
          id: 5,
          name: "Cleveland Browns",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png",
          code: "CLE"
        },
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
          name: "Kansas City Chiefs",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
          code: "KC"
        },
        spread: -3.5,
        time: "Sunday, Sep 10, 1:00 PM ET",
        week: 1,
        season: 2024
      }
    ];
  }
}

export const nflApi = new NFLApiService();
export type { Game, Team };