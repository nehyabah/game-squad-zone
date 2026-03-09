import { api } from "./client";

// ---- Shared types ----

export interface GolfTournamentSetup {
  id: string;
  tournId: string;
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { groups: number; picks: number };
}

export interface GolfGroupPlayer {
  id: string;
  tournamentId: string;
  groupNumber: number;
  playerId: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface GolfPickRecord {
  id: string;
  tournamentId: string;
  userId: string;
  groupNumber: number;
  groupPlayerId: string;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveTournamentResponse {
  id: string;
  tournId: string;
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  isLocked: boolean;
  groups: Record<number, GolfGroupPlayer[]>; // keyed 1–5
  myPicks: GolfPickRecord[];
}

export interface AdminPickEntry {
  id: string;
  groupNumber: number;
  groupPlayerId: string;
  score: number | null;
  user: { id: string; username: string; displayName: string | null; email: string };
  groupPlayer: GolfGroupPlayer;
}

// ---- Admin API ----

export const golfPicksAdminAPI = {
  async createTournament(data: {
    tournId: string;
    year: number;
    name: string;
    startDate: string;
    endDate: string;
  }): Promise<GolfTournamentSetup> {
    const { data: res } = await api.post("/golf-picks/admin/tournament", data);
    return res;
  },

  async getAllTournaments(): Promise<GolfTournamentSetup[]> {
    const { data } = await api.get("/golf-picks/admin/tournaments");
    return data;
  },

  async setActive(id: string): Promise<GolfTournamentSetup> {
    const { data } = await api.patch(`/golf-picks/admin/tournament/${id}/activate`);
    return data;
  },

  async toggleLock(id: string): Promise<GolfTournamentSetup> {
    const { data } = await api.patch(`/golf-picks/admin/tournament/${id}/lock`);
    return data;
  },

  async addPlayer(
    tournamentId: string,
    groupNumber: number,
    playerId: string,
    firstName: string,
    lastName: string
  ): Promise<GolfGroupPlayer> {
    const { data } = await api.post(
      `/golf-picks/admin/tournament/${tournamentId}/players`,
      { groupNumber, playerId, firstName, lastName }
    );
    return data;
  },

  async removePlayer(tournamentId: string, groupPlayerId: string): Promise<void> {
    await api.delete(
      `/golf-picks/admin/tournament/${tournamentId}/players/${groupPlayerId}`
    );
  },

  async getAllPicks(tournamentId: string): Promise<AdminPickEntry[]> {
    const { data } = await api.get(
      `/golf-picks/admin/tournament/${tournamentId}/picks`
    );
    return data;
  },
};

// ---- User API ----

export const golfPicksUserAPI = {
  async getActive(): Promise<ActiveTournamentResponse> {
    const { data } = await api.get("/golf-picks/active");
    return data;
  },

  async getSquadLeaderboard(squadId: string): Promise<{
    tournament: { id: string; tournId: string; year: number; name: string; isLocked: boolean };
    members: {
      userId: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      picks: { groupNumber: number; playerId: string; firstName: string; lastName: string }[];
    }[];
  }> {
    const { data } = await api.get(`/golf-picks/squad/${squadId}`);
    return data;
  },

  async submitPicks(
    tournamentId: string,
    picks: { groupNumber: number; groupPlayerId: string }[]
  ): Promise<{ success: boolean; picks: GolfPickRecord[] }> {
    const { data } = await api.put("/golf-picks/picks", { tournamentId, picks });
    return data;
  },
};
