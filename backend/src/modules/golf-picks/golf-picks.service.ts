// src/modules/golf-picks/golf-picks.service.ts
import { PrismaClient } from "@prisma/client";

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

  async getSquadGolfPicks(squadId: string) {
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

    const members = squadMembers.map((m) => ({
      userId: m.userId,
      username: m.user.username,
      displayName: m.user.displayName,
      avatarUrl: m.user.avatarUrl,
      picks: picks
        .filter((p) => p.userId === m.userId)
        .map((p) => ({
          groupNumber: p.groupNumber,
          playerId: p.groupPlayer.playerId,
          firstName: p.groupPlayer.firstName,
          lastName: p.groupPlayer.lastName,
        })),
    }));

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
