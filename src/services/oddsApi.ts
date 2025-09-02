// services/oddsApi.ts

export interface OddsGame {
  id: string;
  homeTeam: {
    name: string;
    logo: string;
    code: string;
  };
  awayTeam: {
    name: string;
    logo: string;
    code: string;
  };
  spread: number;
  time: string;
  commenceTime: string;
  week?: number;
}

interface OddsApiGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        point?: number;
        price: number;
      }>;
    }>;
  }>;
}

// Team mapping from Odds API names to logo info
const TEAM_MAPPING: Record<string, { logo: string; code: string }> = {
  // AFC East
  "Buffalo Bills": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png", code: "BUF" },
  "Miami Dolphins": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png", code: "MIA" },
  "New England Patriots": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png", code: "NE" },
  "New York Jets": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png", code: "NYJ" },
  
  // AFC North
  "Baltimore Ravens": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png", code: "BAL" },
  "Cincinnati Bengals": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png", code: "CIN" },
  "Cleveland Browns": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png", code: "CLE" },
  "Pittsburgh Steelers": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png", code: "PIT" },
  
  // AFC South
  "Houston Texans": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png", code: "HOU" },
  "Indianapolis Colts": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png", code: "IND" },
  "Jacksonville Jaguars": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png", code: "JAX" },
  "Tennessee Titans": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png", code: "TEN" },
  
  // AFC West
  "Denver Broncos": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png", code: "DEN" },
  "Kansas City Chiefs": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png", code: "KC" },
  "Las Vegas Raiders": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png", code: "LV" },
  "Los Angeles Chargers": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png", code: "LAC" },
  
  // NFC East
  "Dallas Cowboys": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png", code: "DAL" },
  "New York Giants": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png", code: "NYG" },
  "Philadelphia Eagles": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png", code: "PHI" },
  "Washington Commanders": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/was.png", code: "WAS" },
  
  // NFC North
  "Chicago Bears": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png", code: "CHI" },
  "Detroit Lions": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png", code: "DET" },
  "Green Bay Packers": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png", code: "GB" },
  "Minnesota Vikings": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/min.png", code: "MIN" },
  
  // NFC South
  "Atlanta Falcons": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png", code: "ATL" },
  "Carolina Panthers": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png", code: "CAR" },
  "New Orleans Saints": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/no.png", code: "NO" },
  "Tampa Bay Buccaneers": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png", code: "TB" },
  
  // NFC West
  "Arizona Cardinals": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png", code: "ARI" },
  "Los Angeles Rams": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png", code: "LAR" },
  "San Francisco 49ers": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png", code: "SF" },
  "Seattle Seahawks": { logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png", code: "SEA" }
};

class OddsApiService {
  private apiKey = import.meta.env.VITE_ODDS_API_KEY || "78177f5cdef26278574c57dd5c03064d";
  private baseUrl = "https://api.the-odds-api.com/v4";
  
  // NFL 2025 season Week 1 starts Friday, September 5, 2025 (Friday-to-Friday weeks)
  // Update this each season or make it configurable  
  private readonly SEASON_START = new Date('2025-09-05T00:00:00Z');
  private readonly CURRENT_SEASON = 2025;
  
  /**
   * Calculate the current NFL week based on date
   * NFL weeks run Friday to Friday for fantasy purposes
   */
  private getCurrentNFLWeek(): number {
    const now = new Date();
    const seasonStart = this.SEASON_START;
    
    // If before season start, return week 1
    if (now < seasonStart) {
      return 1;
    }
    
    // Find the first Friday of the season (when Week 1 starts)
    const firstFriday = new Date(seasonStart);
    const dayOfWeek = firstFriday.getDay(); // 0 = Sunday, 5 = Friday
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5;
    firstFriday.setDate(firstFriday.getDate() + daysUntilFriday);
    firstFriday.setHours(0, 0, 0, 0);
    
    // If before the first Friday, return week 1
    if (now < firstFriday) {
      return 1;
    }
    
    // Calculate days since first Friday
    const daysSinceFirstFriday = Math.floor((now.getTime() - firstFriday.getTime()) / (1000 * 60 * 60 * 24));
    
    // Each week is 7 days, starting from week 1
    const week = Math.floor(daysSinceFirstFriday / 7) + 1;
    
    // NFL regular season has 18 weeks
    return Math.min(week, 18);
  }
  
  /**
   * Get the date range for a specific NFL week (Friday to Friday)
   * @param week - The week number (1-18)
   * @returns Object with start and end dates for the week
   */
  private getWeekDateRange(week: number): { start: Date; end: Date } {
    // Season start is already set to the first Friday (September 5, 2025)
    const firstFriday = new Date(this.SEASON_START);
    firstFriday.setHours(0, 0, 0, 0);
    
    // Calculate the Friday of the given week (weeks start on Friday)
    const weekStart = new Date(firstFriday);
    weekStart.setDate(firstFriday.getDate() + (week - 1) * 7);
    
    // Week ends on Thursday (6 days later)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return { start: weekStart, end: weekEnd };
  }
  
  /**
   * Check if a game falls within the upcoming week
   */
  private isGameInUpcomingWeek(gameDate: string): boolean {
    const game = new Date(gameDate);
    const currentWeek = this.getCurrentNFLWeek();
    const { start, end } = this.getWeekDateRange(currentWeek);
    
    // Use strict Friday-to-Friday weekly boundaries
    return game >= start && game <= end;
  }

  private mapTeam(teamName: string) {
    const teamInfo = TEAM_MAPPING[teamName];
    if (!teamInfo) {
      console.warn(`No team mapping found for: ${teamName}`);
      return {
        name: teamName,
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png",
        code: teamName.split(" ").pop()?.substring(0, 3).toUpperCase() || "TBD"
      };
    }
    
    return {
      name: teamName,
      logo: teamInfo.logo,
      code: teamInfo.code
    };
  }

  private extractSpreadFromGame(game: OddsApiGame): number {
    // Get the first available spread from any bookmaker
    for (const bookmaker of game.bookmakers) {
      const spreadMarket = bookmaker.markets.find(market => market.key === 'spreads');
      if (spreadMarket) {
        const homeTeamOutcome = spreadMarket.outcomes.find(outcome => outcome.name === game.home_team);
        if (homeTeamOutcome && homeTeamOutcome.point !== undefined) {
          let spread = homeTeamOutcome.point;
          // If spread is a whole number, add 0.5
          if (spread % 1 === 0) {
            spread += 0.5;
          }
          return spread;
        }
      }
    }
    
    // Fallback to random spread if none found
    let spread = Math.round((Math.random() - 0.5) * 14 * 2) / 2;
    // If fallback spread is a whole number, add 0.5
    if (spread % 1 === 0) {
      spread += 0.5;
    }
    return spread;
  }

  async getUpcomingGames(onlyCurrentWeek: boolean = true): Promise<OddsGame[]> {
    const currentWeek = this.getCurrentNFLWeek();
    
    try {
      const url = `${this.baseUrl}/sports/americanfootball_nfl/odds?apiKey=${this.apiKey}&regions=us&markets=spreads`;
      console.log("📡 API URL:", url.replace(this.apiKey, '[API_KEY_HIDDEN]'));
      
      const response = await fetch(url);

      if (!response.ok) {
        console.error("❌ API request failed:", response.status, response.statusText);
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data: OddsApiGame[] = await response.json();
      
      // Filter games for the upcoming week if requested
      let filteredGames = data;
      if (onlyCurrentWeek) {
        filteredGames = data.filter(game => this.isGameInUpcomingWeek(game.commence_time));
        
        const { start, end } = this.getWeekDateRange(currentWeek);
      }
      
      
      return filteredGames.map(game => ({
        id: game.id,
        homeTeam: this.mapTeam(game.home_team),
        awayTeam: this.mapTeam(game.away_team),
        spread: this.extractSpreadFromGame(game),
        time: new Date(game.commence_time).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        commenceTime: game.commence_time,
        week: currentWeek
      }));
      
    } catch (error) {
      console.error("Error fetching odds data:", error);
      // Return fallback games with proper team mapping
      return this.getFallbackGames();
    }
  }

  private getFallbackGames(): OddsGame[] {
    // NFL Week 1 2025 typically starts Thursday Sep 4 and runs through Monday Sep 8
    // Using realistic dates for NFL Week 1 games
    const currentWeek = this.getCurrentNFLWeek();
    const { start } = this.getWeekDateRange(currentWeek);
    
    // Create realistic game times for the week
    const thursday = new Date(start);
    const sunday1 = new Date(start);
    sunday1.setDate(start.getDate() + 3); // Sunday
    const sunday2 = new Date(start);
    sunday2.setDate(start.getDate() + 3); // Sunday evening
    const monday = new Date(start);
    monday.setDate(start.getDate() + 4); // Monday
    
    return [
      {
        id: "fallback-1",
        homeTeam: this.mapTeam("Philadelphia Eagles"),
        awayTeam: this.mapTeam("Dallas Cowboys"),
        spread: -3.5,
        time: sunday1.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        commenceTime: new Date(sunday1.getTime() + 13 * 60 * 60 * 1000).toISOString() // 1 PM
      },
      {
        id: "fallback-2", 
        homeTeam: this.mapTeam("Kansas City Chiefs"),
        awayTeam: this.mapTeam("Buffalo Bills"),
        spread: 2.5,
        time: sunday1.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric', 
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        commenceTime: new Date(sunday1.getTime() + 16.5 * 60 * 60 * 1000).toISOString() // 4:30 PM
      },
      {
        id: "fallback-3",
        homeTeam: this.mapTeam("San Francisco 49ers"),
        awayTeam: this.mapTeam("Green Bay Packers"),
        spread: -1.5,
        time: sunday2.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric', 
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        commenceTime: new Date(sunday2.getTime() + 20.25 * 60 * 60 * 1000).toISOString() // 8:15 PM
      },
      {
        id: "fallback-4",
        homeTeam: this.mapTeam("Miami Dolphins"),
        awayTeam: this.mapTeam("New York Jets"),
        spread: 4.5,
        time: monday.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit', 
          timeZoneName: 'short'
        }),
        commenceTime: new Date(monday.getTime() + 20.25 * 60 * 60 * 1000).toISOString() // 8:15 PM
      }
    ];
  }

  // Get the current NFL week number
  getCurrentWeek(): number {
    return this.getCurrentNFLWeek();
  }
  
  // Get week date range for display
  getWeekDateRangeForDisplay(week?: number): { start: string; end: string; weekNumber: number } {
    const weekNumber = week || this.getCurrentNFLWeek();
    const { start, end } = this.getWeekDateRange(weekNumber);
    
    return {
      weekNumber,
      start: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  }
  
  // Method to get available sports (for future expansion)
  async getSports(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sports/?apiKey=${this.apiKey}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching sports:", error);
      return [];
    }
  }
}

export const oddsApi = new OddsApiService();