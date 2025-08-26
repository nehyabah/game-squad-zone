import type { PrismaClient } from '@prisma/client';

export interface PickRecord {
  id: string;
  gameId: string;
  userId: string;
  selection: 'home' | 'away';
}

/**
 * Picks module data access layer.
 */
export class PickRepo {
  constructor(private readonly prisma: PrismaClient) {}

  createPick(userId: string, gameId: string, selection: 'home' | 'away') {
    return this.prisma.pick.create({
      data: { userId, gameId, selection },
    }) as unknown as Promise<PickRecord>;
  }

  findUserPickForGame(userId: string, gameId: string) {
    return this.prisma.pick.findUnique({
      where: { userId_gameId: { userId, gameId } },
    }) as unknown as Promise<PickRecord | null>;
  }
}
