// services/nflApi.ts

export interface Team {
  id: number;
  name: string;
  logo: string;
  code: string;
}

export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  spread: number;
  time: string;
  week: number;
  season: number;
}

class NFLApiService {
  private baseUrl = "https://v1.american-football.api-sports.io";
  private apiKey: string | null = null;

  constructor() {
    // Use the provided API key directly
    this.apiKey = "3c0e011b07d02537bbbb1ce5e26227e3";
  }

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem("nfl_api_key", key);
  }

  private async makeRequest(endpoint: string) {
    if (!this.apiKey) {
      throw new Error("API key not set");
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        "X-RapidAPI-Key": this.apiKey,
        "X-RapidAPI-Host": "v1.american-football.api-sports.io",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getTeams(): Promise<Team[]> {
    try {
      const data = await this.makeRequest("/teams");
      return data.response || [];
    } catch (error) {
      console.error("Error fetching teams:", error);
      return [];
    }
  }

  async getGames(season: number = 2023, week: number = 1): Promise<Game[]> {
    console.log("Attempting to fetch games...");
    try {
      const data = await this.makeRequest(
        `/games?league=1&season=${season}&week=${week}`
      );
      console.log("API response:", data);

      // Transform API response to our Game interface
      const games: Game[] =
        data.response?.map((apiGame: any) => ({
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
        console.log("No games returned from API, using fallback");
        return this.getFallbackGames();
      }

      return games;
    } catch (error) {
      console.error("API request failed (likely CORS), using fallback games:", error);
      return this.getFallbackGames();
    }
  }

  private calculateSpread(apiGame: any): number {
    // Placeholder: random spread between -7 and +7 in half-point increments
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
          code: "NE",
        },
        awayTeam: {
          id: 2,
          name: "Tampa Bay Buccaneers",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png",
          code: "TB",
        },
        spread: -3.5,
        time: "Sunday, Sep 10, 1:00 PM ET",
        week: 1,
        season: 2024,
      },
      {
        id: "2",
        homeTeam: {
          id: 3,
          name: "Carolina Panthers",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png",
          code: "CAR",
        },
        awayTeam: {
          id: 4,
          name: "Atlanta Falcons",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png",
          code: "ATL",
        },
        spread: 2.5,
        time: "Sunday, Sep 10, 1:00 PM ET",
        week: 1,
        season: 2024,
      },
      {
        id: "3",
        homeTeam: {
          id: 5,
          name: "Cleveland Browns",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png",
          code: "CLE",
        },
        awayTeam: {
          id: 6,
          name: "Cincinnati Bengals",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png",
          code: "CIN",
        },
        spread: 5.5,
        time: "Sunday, Sep 10, 1:00 PM ET",
        week: 1,
        season: 2024,
      },
      {
        id: "4",
        homeTeam: {
          id: 7,
          name: "Detroit Lions",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png",
          code: "DET",
        },
        awayTeam: {
          id: 8,
          name: "Kansas City Chiefs",
          logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
          code: "KC",
        },
        spread: -3.5,
        time: "Sunday, Sep 10, 1:00 PM ET",
        week: 1,
        season: 2024,
      },
    ];
  }
}

export const nflApi = new NFLApiService();
