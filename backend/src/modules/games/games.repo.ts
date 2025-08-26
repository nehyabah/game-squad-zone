import type { PrismaClient } from '@prisma/client';

export interface GameRecord {
  id: string;
  startAtUtc: Date;
  weekId: string;
}

/**
 * Games module data access layer.
 */
export class GameRepo {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string) {
    return this.prisma.game.findUnique({
      where: { id },
    }) as unknown as Promise<GameRecord | null>;
  }

  findByIds(ids: string[]) {
    return this.prisma.game.findMany({
      where: { id: { in: ids } },
    }) as unknown as Promise<GameRecord[]>;
  }
}
