import type { PrismaClient } from '@prisma/client';

export interface PickSetRecord {
  id: string;
  userId: string;
  squadId: string;
  weekId: string;
  submittedAtUtc: Date;
  lockedAtUtc?: Date;
  tiebreakerScore?: number;
  status: 'draft' | 'submitted' | 'locked';
}

export interface PickRecord {
  id: string;
  pickSetId: string;
  gameId: string;
  choice: 'home' | 'away';
  spreadAtPick: number;
  lineSource: string;
  createdAt: Date;
}

/**
 * Picks module data access layer.
 */
export class PickRepo {
  constructor(private readonly prisma: PrismaClient) {}

  findByUserWeekSquad(userId: string, weekId: string, squadId: string) {
    return this.prisma.pickSet.findFirst({
      where: { userId, weekId, squadId },
    }) as unknown as Promise<PickSetRecord | null>;
  }

  createPickSet(data: {
    userId: string;
    squadId: string;
    weekId: string;
    status: 'draft' | 'submitted' | 'locked';
    tiebreakerScore?: number;
  }) {
    return this.prisma.pickSet.create({
      data,
    }) as unknown as Promise<PickSetRecord>;
  }

  upsertPick(data: {
    pickSetId: string;
    gameId: string;
    choice: 'home' | 'away';
    spreadAtPick: number;
    lineSource: string;
  }) {
    return this.prisma.pick.upsert({
      where: {
        pickSetId_gameId: {
          pickSetId: data.pickSetId,
          gameId: data.gameId,
        },
      },
      create: data,
      update: {
        choice: data.choice,
        spreadAtPick: data.spreadAtPick,
        lineSource: data.lineSource,
      },
    }) as unknown as Promise<PickRecord>;
  }
}
