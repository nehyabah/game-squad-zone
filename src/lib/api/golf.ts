import { api } from "./client";

export interface GolfTournament {
  tournId: string;
  name: string;
  date: { start: string; end: string; weekNumber: string };
  format: string;
  purse: number;
  winnersShare?: number;
}

export interface GolfRound {
  roundId: number;
  strokes: number;
  scoreToPar: string;
  courseName: string;
}

export interface GolfPlayer {
  playerId: string;
  firstName: string;
  lastName: string;
  position: string;
  total: string;
  currentRoundScore: string;
  thru: string;
  status: string;
  totalStrokesFromCompletedRounds: string;
  rounds: GolfRound[];
}

export interface GolfLeaderboardResponse {
  tournId: string;
  year: string;
  status: string;
  roundId: number;
  lastUpdated: string;
  leaderboardRows: GolfPlayer[];
}

export interface GolfScheduleResponse {
  orgId: string;
  year: string;
  schedule: GolfTournament[];
}

export const golfAPI = {
  async getSchedule(year = new Date().getFullYear()): Promise<GolfScheduleResponse> {
    const { data } = await api.get("/golf/schedule", { params: { year } });
    return data;
  },

  async getLeaderboard(tournId: string, year = new Date().getFullYear()): Promise<GolfLeaderboardResponse> {
    const { data } = await api.get("/golf/leaderboard", { params: { tournId, year } });
    return data;
  },
};
