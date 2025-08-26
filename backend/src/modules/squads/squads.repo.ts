import type { PrismaClient } from '@prisma/client';

export interface SquadMemberRecord {
  id: string;
  squadId: string;
  userId: string;
}

export interface SquadRecord {
  id: string;
  name: string;
  joinCode: string;
  ownerId: string;
  members?: SquadMemberRecord[];
}

/**
 * Squads module data access layer.
 */
export class SquadRepo {
  constructor(private readonly prisma: PrismaClient) {}

  createSquad(name: string, joinCode: string, ownerId: string): Promise<SquadRecord> {
    return this.prisma.squad.create({
      data: { name, joinCode, ownerId },
    }) as unknown as Promise<SquadRecord>;
  }

  findSquadById(id: string): Promise<SquadRecord | null> {
    return this.prisma.squad.findUnique({
      where: { id },
      include: {
        members: {
          select: { id: true, squadId: true, userId: true },
        },
      },
    }) as unknown as Promise<SquadRecord | null>;
  }

  findByJoinCode(joinCode: string): Promise<SquadRecord | null> {
    return this.prisma.squad.findUnique({
      where: { joinCode },
    }) as unknown as Promise<SquadRecord | null>;
  }

  async addMember(squadId: string, userId: string): Promise<void> {
    await this.prisma.squadMember.create({
      data: { squadId, userId },
    });
  }

  async isMember(squadId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.squadMember.findUnique({
      where: { squadId_userId: { squadId, userId } },
      select: { id: true },
    });
    return Boolean(member);
  }
}
