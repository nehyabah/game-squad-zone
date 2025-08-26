import type { PrismaClient } from '@prisma/client';

export interface SquadRecord {
  id: string;
  name: string;
  joinCode: string;
  ownerId: string;
  members?: unknown[];
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
      include: { members: true },
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
}
