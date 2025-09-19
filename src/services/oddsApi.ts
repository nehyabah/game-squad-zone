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
  private apiKey = import.meta.env.VITE_ODDS_API_KEY || "5aa0a3d280740ab65185d78b950d7c02";
  private baseUrl = "https://api.the-odds-api.com/v4";
  
  // NFL 2025 season starts Friday, September 5, 2025
  // Weeks run Friday to Tuesday for pick'em pools
  private readonly SEASON_START = new Date('2025-09-05T00:00:00Z');
  private readonly CURRENT_SEASON = 2025;
  
  /**
   * Calculate the current NFL week based on date
   * NFL weeks run Friday to Tuesday (5 days for picks)
   */
  private getCurrentNFLWeek(): number {
    // HARDCODED: Force current week to be Week 3 for demo
    return 3;
    
    // Original logic commented out:
    // const now = new Date();
    // const seasonStart = this.SEASON_START;
    // 
    // // If before season start, return week 1
    // if (now < seasonStart) {
    //   return 1;
    // }
    // 
    // // Calculate days since season start (Friday)
    // const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
    // 
    // // Each week is 7 days
    // // Week 1: Friday Sep 5 - Thursday Sep 11
    // // Week 2: Friday Sep 12 - Thursday Sep 18
    // // etc.
    // const week = Math.floor(daysSinceStart / 7) + 1;
    // 
    // // NFL regular season has 18 weeks, then playoffs
    // // Allow up to week 22 for playoffs/Super Bowl
    // return Math.min(week, 22);
  }
  
  /**
   * Get the date range for a specific NFL week (Friday to Tuesday)
   * @param week - The week number (1-18)
   * @returns Object with start and end dates for the week
   */
  private getWeekDateRange(week: number): { start: Date; end: Date } {
    // Season starts on Friday September 5, 2025
    const weekStart = new Date(this.SEASON_START);
    weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
    weekStart.setHours(0, 0, 0, 0);
    
    // Week ends on Tuesday (4 days later: Fri, Sat, Sun, Mon, Tue)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4);
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
    // Hard-coded Week 3 games with fixed spreads - ALWAYS return these
    const hardCodedWeek3Games = this.getHardCodedWeek3Games();
    console.log("🎯 Using hard-coded Week 3 games with fixed spreads", hardCodedWeek3Games.length);
    return hardCodedWeek3Games;

    try {
      const url = `${this.baseUrl}/sports/americanfootball_nfl/odds?apiKey=${this.apiKey}&regions=us&markets=spreads`;
      console.log("📡 Fetching NFL games from Odds API...");
      
      const response = await fetch(url);

      if (!response.ok) {
        console.error("❌ API request failed:", response.status, response.statusText);
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data: OddsApiGame[] = await response.json();
      console.log(`✅ Received ${data.length} games from API`);
      
      if (data.length === 0) {
        console.log("⚠️ No games from API, using fallback games");
        return this.getFallbackGames();
      }
      
      // Determine the current week dynamically
      // First, check if we have any games to determine the season year
      const firstGameDate = new Date(data[0].commence_time);
      const gameYear = firstGameDate.getFullYear();
      
      // Dynamically set season start based on the year of the games
      // NFL season typically starts first Thursday/Friday of September
      const seasonStart = new Date(`${gameYear}-09-01T00:00:00Z`);
      // Find first Friday of September
      while (seasonStart.getDay() !== 5) { // 5 = Friday
        seasonStart.setDate(seasonStart.getDate() + 1);
      }
      
      // Calculate current week based on TODAY's date
      const today = new Date();
      let currentWeek = 1;
      
      if (today >= seasonStart) {
        const daysSinceStart = Math.floor((today.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
        currentWeek = Math.floor(daysSinceStart / 7) + 1;
        // Cap at week 22 for playoffs
        currentWeek = Math.min(currentWeek, 22);
      }
      
      // Filter games for current week (Friday to Tuesday)
      let filteredGames = data;
      if (onlyCurrentWeek && data.length > 0) {
        // Find the earliest game date to determine the actual current week
        const sortedGames = [...data].sort((a, b) => 
          new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
        );
        const firstGameDate = new Date(sortedGames[0].commence_time);
        
        // Find which Friday this game belongs to
        const gameDayOfWeek = firstGameDate.getDay();
        let weekStartDate = new Date(firstGameDate);
        
        // If game is on Wed or Thu, it belongs to previous week
        if (gameDayOfWeek === 3 || gameDayOfWeek === 4) {
          // Go back to previous Friday
          const daysToSubtract = gameDayOfWeek === 3 ? 5 : 6;
          weekStartDate.setDate(weekStartDate.getDate() - daysToSubtract);
        } else if (gameDayOfWeek !== 5) {
          // Go back to most recent Friday
          const daysToSubtract = gameDayOfWeek === 6 ? 1 : // Saturday -> -1
                                  gameDayOfWeek === 0 ? 2 : // Sunday -> -2
                                  gameDayOfWeek === 1 ? 3 : // Monday -> -3
                                  gameDayOfWeek === 2 ? 4 : // Tuesday -> -4
                                  0;
          weekStartDate.setDate(weekStartDate.getDate() - daysToSubtract);
        }
        
        weekStartDate.setHours(0, 0, 0, 0);
        
        // Week ends on Tuesday (4 days after Friday)
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 4);
        weekEndDate.setHours(23, 59, 59, 999);
        
        // Calculate week number
        const weeksSinceStart = Math.floor((weekStartDate.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        const displayWeek = Math.max(1, Math.min(weeksSinceStart, 22));
        
        console.log(`📅 Week ${displayWeek}: ${weekStartDate.toLocaleDateString()} (Fri) to ${weekEndDate.toLocaleDateString()} (Tue)`);
        
        filteredGames = data.filter(game => {
          const gameDate = new Date(game.commence_time);
          return gameDate >= weekStartDate && gameDate <= weekEndDate;
        });
        
        console.log(`📊 Showing ${filteredGames.length} games for Week ${displayWeek}`);
        
        // Update currentWeek to reflect actual week
        currentWeek = displayWeek;
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

  private getHardCodedWeek3Games(): OddsGame[] {
    // Hard-coded Week 3 games with fixed spreads for this weekend
    const games = [
      {
        home: "Pittsburgh Steelers",
        away: "New England Patriots", 
        date: "Sep 21",
        time: "18:01",
        spread: { home: -1.5, away: +1.5 }
      },
      {
        home: "Los Angeles Rams",
        away: "Philadelphia Eagles",
        date: "Sep 21", 
        time: "18:01",
        spread: { home: +3.5, away: -3.5 }
      },
      {
        home: "Green Bay Packers",
        away: "Cleveland Browns",
        date: "Sep 21",
        time: "18:01", 
        spread: { home: -7.5, away: +7.5 }
      },
      {
        home: "Las Vegas Raiders",
        away: "Washington Commanders",
        date: "Sep 21",
        time: "18:01",
        spread: { home: +3.5, away: -3.5 }
      },
      {
        home: "Cincinnati Bengals", 
        away: "Minnesota Vikings",
        date: "Sep 21",
        time: "18:01",
        spread: { home: -3.5, away: +3.5 }
      },
      {
        home: "New York Jets",
        away: "Tampa Bay Buccaneers",
        date: "Sep 21",
        time: "18:01",
        spread: { home: +6.5, away: -6.5 }
      },
      {
        home: "Indianapolis Colts",
        away: "Tennessee Titans", 
        date: "Sep 21",
        time: "18:01",
        spread: { home: -4.5, away: +4.5 }
      },
      {
        home: "Houston Texans",
        away: "Jacksonville Jaguars",
        date: "Sep 21", 
        time: "18:01",
        spread: { home: +2.5, away: -2.5 }
      },
      {
        home: "New Orleans Saints",
        away: "Seattle Seahawks",
        date: "Sep 21",
        time: "18:01",
        spread: { home: -7.5, away: +7.5 }
      },
      {
        home: "Arizona Cardinals",
        away: "San Francisco 49ers",
        date: "Sep 21",
        time: "21:26",
        spread: { home: +2.5, away: -2.5 }
      },
      {
        home: "Kansas City Chiefs", 
        away: "New York Giants",
        date: "Sep 22",
        time: "01:21",
        spread: { home: -5.5, away: +5.5 }
      },
      {
        home: "Detroit Lions",
        away: "Baltimore Ravens",
        date: "Sep 23", 
        time: "01:16",
        spread: { home: +5.5, away: -5.5 }
      },
      {
        home: "Denver Broncos",
        away: "Los Angeles Chargers",
        date: "Sep 21",
        time: "21:06",
        spread: { home: +2.5, away: -2.5 }
      },
      {
        home: "Atlanta Falcons",
        away: "Carolina Panthers",
        date: "Sep 21",
        time: "18:00",
        spread: { home: -5.5, away: +5.5 }
      },
      {
        home: "Dallas Cowboys",
        away: "Chicago Bears",
        date: "Sep 21",
        time: "18:00",
        spread: { home: -1.5, away: +1.5 }
      }
    ];

    return games.map((game, index) => {
      // Convert date format: "Sep 21" to "2025-09-21"
      const dateMap: { [key: string]: string } = {
        "Sep 21": "2025-09-21",
        "Sep 22": "2025-09-22", 
        "Sep 23": "2025-09-23"
      };
      const isoDate = dateMap[game.date] || "2025-09-21";
      
      return {
        id: `week3-${index + 1}`,
        homeTeam: this.mapTeam(game.home),
        awayTeam: this.mapTeam(game.away),
        spread: game.spread.home,
        time: `${game.date}, ${game.time}`,
        commenceTime: new Date(`${isoDate}T${game.time}:00Z`).toISOString(),
        week: 3
      };
    });
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
    const weekNumber = week || this.getCurrentNFLWeek(); // Use current week (hardcoded to 3)
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