import type { PrismaClient } from '@prisma/client';

export interface PickSetRecord {
  id: string;
  userId: string;
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
  status: 'pending' | 'won' | 'lost' | 'pushed';
  result?: string;
  payout?: number;
  odds?: number;
}

/**
 * Picks module data access layer.
 */
export class PickRepo {
  constructor(private readonly prisma: PrismaClient) {}

  findByUserWeek(userId: string, weekId: string, sport?: string) {
    return this.prisma.pickSet.findFirst({
      where: {
        userId,
        weekId,
        ...(sport && { sport })
      },
      include: {
        picks: {
          select: {
            id: true,
            pickSetId: true,
            gameId: true,
            choice: true,
            spreadAtPick: true,
            lineSource: true,
            createdAtUtc: true,
            status: true,
            result: true,
            payout: true,
            odds: true,
            game: {
              select: {
                id: true,
                homeTeam: true,
                awayTeam: true,
                startAtUtc: true,
                weekId: true,
                homeScore: true,
                awayScore: true,
                completed: true
              }
            }
          }
        }
      }
    }) as unknown as Promise<PickSetRecord | null>;
  }

  createPickSet(data: {
    userId: string;
    weekId: string;
    status: 'draft' | 'submitted' | 'locked';
    tiebreakerScore?: number;
    sport?: string;
  }) {
    return this.prisma.pickSet.create({
      data: {
        ...data,
        sport: data.sport || 'nfl'
      },
    }) as unknown as Promise<PickSetRecord>;
  }

  updatePickSet(id: string, data: {
    tiebreakerScore?: number;
    status?: 'draft' | 'submitted' | 'locked';
  }) {
    return this.prisma.pickSet.update({
      where: { id },
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

  async getPicksByPickSetId(pickSetId: string): Promise<PickRecord[]> {
    return this.prisma.pick.findMany({
      where: { pickSetId },
      orderBy: { createdAtUtc: 'asc' },
    }) as unknown as Promise<PickRecord[]>;
  }

  async findAllByUser(userId: string, sport?: string): Promise<PickSetRecord[]> {
    return this.prisma.pickSet.findMany({
      where: {
        userId,
        ...(sport && { sport })
      },
      include: {
        picks: {
          select: {
            id: true,
            pickSetId: true,
            gameId: true,
            choice: true,
            spreadAtPick: true,
            lineSource: true,
            createdAtUtc: true,
            status: true,
            result: true,
            payout: true,
            odds: true,
            game: {
              select: {
                id: true,
                homeTeam: true,
                awayTeam: true,
                startAtUtc: true,
                weekId: true,
                homeScore: true,
                awayScore: true,
                completed: true
              }
            }
          }
        }
      },
      orderBy: { weekId: 'desc' }
    }) as unknown as Promise<PickSetRecord[]>;
  }

  async deletePicks(pickSetId: string): Promise<void> {
    await this.prisma.pick.deleteMany({
      where: { pickSetId }
    });
  }

  async deletePickSet(pickSetId: string): Promise<void> {
    await this.prisma.pickSet.delete({
      where: { id: pickSetId }
    });
  }
}