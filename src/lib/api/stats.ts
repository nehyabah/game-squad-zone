// Frontend Statistics API client
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface TeamStats {
  team: string;
  picks: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
}

export interface SpreadPerformance {
  range: string;
  wins: number;
  losses: number;
  pushes: number;
  totalPicks: number;
  winRate: number;
}

export interface PickPatterns {
  homeRate: number;
  awayRate: number;
  favoriteRate: number;
  underdogRate: number;
}

export interface WeeklyPerformance {
  weekId: string;
  wins: number;
  losses: number;
  pushes: number;
  points: number;
}

export interface PersonalStatsData {
  totalPicks: number;
  totalWins: number;
  totalLosses: number;
  totalPushes: number;
  winPercentage: number;
  favoriteTeams: TeamStats[];
  avoidedTeams: string[];
  pickPatterns: PickPatterns;
  spreadPerformance: SpreadPerformance[];
  weeklyPerformance: WeeklyPerformance[];
  bestWeek: {
    weekId: string;
    points: number;
    record: string;
  } | null;
}

export interface SquadStatsData {
  mostPickedTeams: TeamStats[];
  pickPatterns: PickPatterns;
  spreadDistribution: {
    range: string;
    count: number;
  }[];
  leader: {
    name: string;
    winPercentage: number;
  } | null;
}

export interface MemberComparisonData {
  member1Stats: PersonalStatsData;
  member2Stats: PersonalStatsData;
  headToHead: {
    member1Wins: number;
    member2Wins: number;
  };
}

class StatsAPI {
  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Get personal statistics
  async getPersonalStats(userId: string, squadId?: string): Promise<PersonalStatsData> {
    const params = squadId ? `?squadId=${squadId}` : '';
    return this.request<PersonalStatsData>(`/api/stats/personal/${userId}${params}`);
  }

  // Get squad statistics
  async getSquadStats(squadId: string): Promise<SquadStatsData> {
    return this.request<SquadStatsData>(`/api/stats/squad/${squadId}`);
  }

  // Get member comparison
  async getMemberComparison(
    member1Id: string,
    member2Id: string,
    squadId: string
  ): Promise<MemberComparisonData> {
    const params = new URLSearchParams({
      member1Id,
      member2Id,
      squadId,
    });
    return this.request<MemberComparisonData>(`/api/stats/comparison?${params.toString()}`);
  }
}

export const statsAPI = new StatsAPI();
