// Frontend Leaderboard API client
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  points: number;
  wins: number;
  losses: number;
  pushes: number;
  winPercentage: number;
  rank: number;
  isCurrentUser?: boolean;
}

export interface WeeklyLeaderboardEntry extends LeaderboardEntry {
  weekId: string;
}

class LeaderboardAPI {
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

  // Get season leaderboard
  async getSeasonLeaderboard(sport?: string): Promise<LeaderboardEntry[]> {
    const params = sport ? `?sport=${sport}` : '';
    return this.request<LeaderboardEntry[]>(`/api/leaderboards/season${params}`);
  }

  // Get weekly leaderboard
  async getWeeklyLeaderboard(weekId: string, sport?: string): Promise<WeeklyLeaderboardEntry[]> {
    const params = sport ? `?sport=${sport}` : '';
    return this.request<WeeklyLeaderboardEntry[]>(`/api/leaderboards/weekly/${weekId}${params}`);
  }

  // Get squad leaderboard
  async getSquadLeaderboard(squadId: string, weekId?: string): Promise<LeaderboardEntry[]> {
    const params = weekId ? `?weekId=${weekId}` : '';
    return this.request<LeaderboardEntry[]>(`/api/leaderboards/squad/${squadId}${params}`);
  }

  // Get user rank
  async getUserRank(userId: string, weekId?: string): Promise<{ rank: number; totalUsers: number } | null> {
    const params = weekId ? `?weekId=${weekId}` : '';
    return this.request<{ rank: number; totalUsers: number } | null>(`/api/leaderboards/rank/${userId}${params}`);
  }

  // Generic leaderboard query
  async getLeaderboard(params?: {
    scope?: 'squad' | 'global';
    week?: string;
    squadId?: string;
  }): Promise<LeaderboardEntry[]> {
    const query = new URLSearchParams();
    if (params?.scope) query.append('scope', params.scope);
    if (params?.week) query.append('week', params.week);
    if (params?.squadId) query.append('squadId', params.squadId);
    
    const queryString = query.toString();
    return this.request<LeaderboardEntry[]>(`/api/leaderboards${queryString ? `?${queryString}` : ''}`);
  }
}

export const leaderboardAPI = new LeaderboardAPI();