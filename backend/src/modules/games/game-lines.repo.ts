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
    // First try to get Wednesday cached spread (for consistent picks)
    const wednesdayLine = await this.prisma.gameLine.findFirst({
      where: {
        gameId,
        source: 'odds-api-wednesday'
      },
      orderBy: { fetchedAtUtc: 'desc' },
    });

    // If no Wednesday cache exists, fall back to latest from any source
    if (wednesdayLine) {
      return wednesdayLine as unknown as GameLineRecord;
    }

    return (await this.prisma.gameLine.findFirst({
      where: { gameId },
      orderBy: { fetchedAtUtc: 'desc' },
    })) as unknown as GameLineRecord;
  }
}

