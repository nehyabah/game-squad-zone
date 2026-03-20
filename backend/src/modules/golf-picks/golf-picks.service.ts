// src/modules/golf-picks/golf-picks.service.ts
import { PrismaClient } from "@prisma/client";
import https from "https";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "d1183719e6msh532ead7af6fa213p15c074jsn709877193329";
const RAPIDAPI_HOST = "live-golf-data.p.rapidapi.com";

function fetchGolfApi(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: RAPIDAPI_HOST,
        path,
        method: "GET",
        headers: { "x-rapidapi-host": RAPIDAPI_HOST, "x-rapidapi-key": RAPIDAPI_KEY },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); } catch { reject(new Error("Invalid JSON from golf API")); }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function parseScoreStr(score: string | undefined): number {
  if (!score || score === "E") return 0;
  const n = parseInt(score, 10);
  return isNaN(n) ? 0 : n;
}

export class GolfPicksService {
  constructor(private prisma: PrismaClient) {}

  async createTournament(data: {
    tournId: string;
    year: number;
    name: string;
    startDate: string;
    endDate: string;
  }) {
    // Deactivate all existing tournaments first
    await this.prisma.golfTournamentSetup.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    return this.prisma.golfTournamentSetup.create({
      data: {
        tournId: data.tournId,
        year: data.year,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: true,
        isLocked: false,
      },
    });
  }

  async getAllTournaments() {
    const tournaments = await this.prisma.golfTournamentSetup.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { groups: true, picks: true } },
      },
    });
    return tournaments;
  }

  async setActive(id: string) {
    const tournament = await this.prisma.golfTournamentSetup.findUnique({
      where: { id },
    });
    if (!tournament) throw new Error("Tournament not found");

    // Deactivate all, then activate the chosen one
    await this.prisma.golfTournamentSetup.updateMany({
      data: { isActive: false },
    });

    return this.prisma.golfTournamentSetup.update({
      where: { id },
      data: { isActive: true },
      include: { _count: { select: { groups: true, picks: true } } },
    });
  }

  async toggleLock(id: string) {
    const tournament = await this.prisma.golfTournamentSetup.findUnique({
      where: { id },
    });
    if (!tournament) throw new Error("Tournament not found");

    return this.prisma.golfTournamentSetup.update({
      where: { id },
      data: { isLocked: !tournament.isLocked },
    });
  }

  async addGroupPlayer(data: {
    tournamentId: string;
    groupNumber: number;
    playerId: string;
    firstName: string;
    lastName: string;
  }) {
    return this.prisma.golfGroupPlayer.create({
      data: {
        tournamentId: data.tournamentId,
        groupNumber: data.groupNumber,
        playerId: data.playerId,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
  }

  async removeGroupPlayer(groupPlayerId: string) {
    return this.prisma.golfGroupPlayer.delete({
      where: { id: groupPlayerId },
    });
  }

  async getActiveTournamentWithGroups(userId: string) {
    const tournament = await this.prisma.golfTournamentSetup.findFirst({
      where: { isActive: true },
      include: {
        groups: {
          orderBy: [{ groupNumber: "asc" }, { firstName: "asc" }],
        },
        picks: {
          where: { userId },
        },
      },
    });

    if (!tournament) return null;

    // Key groups by groupNumber
    const groupsMap: Record<number, typeof tournament.groups> = {};
    for (const player of tournament.groups) {
      if (!groupsMap[player.groupNumber]) groupsMap[player.groupNumber] = [];
      groupsMap[player.groupNumber].push(player);
    }

    return {
      id: tournament.id,
      tournId: tournament.tournId,
      year: tournament.year,
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      isLocked: tournament.isLocked,
      groups: groupsMap,
      myPicks: tournament.picks,
    };
  }

  async getSquadGolfPicks(squadId: string, requestingUserId: string) {
    const tournament = await this.prisma.golfTournamentSetup.findFirst({
      where: { isActive: true },
    });
    if (!tournament) return null;

    const squadMembers = await this.prisma.squadMember.findMany({
      where: { squadId },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    const userIds = squadMembers.map((m) => m.userId);
    const picks = await this.prisma.golfPick.findMany({
      where: { tournamentId: tournament.id, userId: { in: userIds } },
      include: { groupPlayer: true },
      orderBy: [{ userId: "asc" }, { groupNumber: "asc" }],
    });

    const members = squadMembers.map((m) => {
      const memberPicks = picks.filter((p) => p.userId === m.userId);
      // Hide other members' picks until tournament is locked
      const isOwnPicks = m.userId === requestingUserId;
      const revealPicks = tournament.isLocked || isOwnPicks;

      return {
        userId: m.userId,
        username: m.user.username,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        picksSubmitted: memberPicks.length,
        picks: revealPicks
          ? memberPicks.map((p) => ({
              groupNumber: p.groupNumber,
              playerId: p.groupPlayer.playerId,
              firstName: p.groupPlayer.firstName,
              lastName: p.groupPlayer.lastName,
              score: p.score,
            }))
          : [],
      };
    });

    return {
      tournament: {
        id: tournament.id,
        tournId: tournament.tournId,
        year: tournament.year,
        name: tournament.name,
        isLocked: tournament.isLocked,
      },
      members,
    };
  }

  async getGroupsForTournament(tournamentId: string) {
    return this.prisma.golfGroupPlayer.findMany({
      where: { tournamentId },
      orderBy: [{ groupNumber: "asc" }, { firstName: "asc" }],
    });
  }

  async getAllPicksForTournament(tournamentId: string) {
    return this.prisma.golfPick.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, email: true },
        },
        groupPlayer: true,
      },
      orderBy: [{ userId: "asc" }, { groupNumber: "asc" }],
    });
  }

  async refreshScores(tournamentId: string): Promise<{ updated: number }> {
    const tournament = await this.prisma.golfTournamentSetup.findUnique({
      where: { id: tournamentId },
      include: { picks: { include: { groupPlayer: true } } },
    });
    if (!tournament) throw new Error("Tournament not found");

    const leaderboardData = await fetchGolfApi(
      `/leaderboard?orgId=1&tournId=${tournament.tournId}&year=${tournament.year}`
    );

    const statsMap = new Map<string, any>();
    for (const p of leaderboardData.leaderboardRows ?? []) {
      statsMap.set(p.playerId, p);
    }

    let updated = 0;
    await Promise.all(
      tournament.picks.map(async (pick) => {
        const player = statsMap.get(pick.groupPlayer.playerId);
        if (!player) return;
        const isCut = player.status === "cut" || player.status === "C";
        const score = parseScoreStr(player.total) + (isCut ? 2 : 0);
        await this.prisma.golfPick.update({ where: { id: pick.id }, data: { score } });
        updated++;
      })
    );

    return { updated };
  }

  async upsertPicks(
    userId: string,
    tournamentId: string,
    picks: { groupNumber: number; groupPlayerId: string }[]
  ) {
    const tournament = await this.prisma.golfTournamentSetup.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) throw new Error("Tournament not found");
    if (tournament.isLocked) throw new Error("Tournament is locked");

    // Validate all groupPlayerIds belong to this tournament
    const groupPlayerIds = picks.map((p) => p.groupPlayerId);
    const players = await this.prisma.golfGroupPlayer.findMany({
      where: { id: { in: groupPlayerIds }, tournamentId },
    });

    if (players.length !== picks.length) {
      throw new Error("One or more players not found in this tournament");
    }

    // Upsert each pick
    const results = await Promise.all(
      picks.map((pick) =>
        this.prisma.golfPick.upsert({
          where: {
            tournamentId_userId_groupNumber: {
              tournamentId,
              userId,
              groupNumber: pick.groupNumber,
            },
          },
          update: { groupPlayerId: pick.groupPlayerId },
          create: {
            tournamentId,
            userId,
            groupNumber: pick.groupNumber,
            groupPlayerId: pick.groupPlayerId,
          },
        })
      )
    );

    return results;
  }
}
