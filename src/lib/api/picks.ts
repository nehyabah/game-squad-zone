import { api } from './client';

export interface GamePick {
  gameId: string;
  selection: 'home' | 'away';
}

export interface SubmitPicksData {
  weekId: string;
  picks: GamePick[];
  tiebreakerScore?: number;
}

export interface PickSet {
  id: string;
  userId: string;
  weekId: string;
  submittedAtUtc?: string;
  lockedAtUtc?: string;
  tiebreakerScore?: number;
  status: 'draft' | 'submitted' | 'locked';
  picks?: Pick[];
}

export interface Pick {
  id: string;
  pickSetId: string;
  gameId: string;
  choice: 'home' | 'away';
  spreadAtPick: number;
  lineSource: string;
  createdAtUtc: string;
  // Result fields from backend
  status: 'pending' | 'won' | 'lost' | 'pushed';
  result?: string; // Format: "won:10" or "lost:0" etc
  payout?: number;
  odds?: number;
  game?: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    startAtUtc: string;
    weekId: string;
    homeScore?: number;
    awayScore?: number;
    completed: boolean;
  };
}

export const picksApi = {
  // Submit picks for a week
  submitPicks: async (data: SubmitPicksData): Promise<PickSet> => {
    const response = await api.post('/picks', data);
    return response.data;
  },

  // Get picks for a specific week
  getWeekPicks: async (weekId: string, sport?: string): Promise<PickSet | null> => {
    try {
      const sportParam = sport ? `&sport=${sport}` : '';
      const response = await api.get(`/picks/me?weekId=${weekId}${sportParam}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get all pick history
  getPickHistory: async (sport?: string): Promise<PickSet[]> => {
    const sportParam = sport ? `?sport=${sport}` : '';
    const response = await api.get(`/picks/history${sportParam}`);
    return response.data;
  },

  // Get picks for any user for a specific week
  getUserPicks: async (userId: string, weekId: string, sport?: string): Promise<PickSet | null> => {
    try {
      const params = new URLSearchParams({ weekId });
      if (sport) {
        params.append('sport', sport);
      }
      const response = await api.get(`/picks/user/${userId}?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Delete picks for a specific week
  deletePicks: async (weekId: string): Promise<void> => {
    await api.delete(`/picks/me?weekId=${weekId}`);
  },

  // Get complete pick history for any user
  getUserPickHistory: async (userId: string): Promise<PickSet[]> => {
    const response = await api.get(`/picks/user/${userId}/history`);
    return response.data;
  },
};