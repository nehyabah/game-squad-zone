import type { PrismaClient } from '@prisma/client';

export interface GameLineRecord {
  gameId: string;
  spread: number;
  source: string;
  fetchedAtUtc: Date;
}

/**
 * Game lines data access layer.
 */
export class GameLineRepo {
  constructor(private readonly prisma: PrismaClient) {}

  async getLatest(gameId: string) {
    return (await this.prisma.gameLine.findFirst({
      where: { gameId },
      orderBy: { fetchedAtUtc: 'desc' },
    })) as unknown as GameLineRecord;
  }
}

