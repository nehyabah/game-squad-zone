import { PrismaClient } from "@prisma/client";
import { GolfPicksService } from "../modules/golf-picks/golf-picks.service";

export class GolfScoringService {
  private service: GolfPicksService;

  constructor(prisma: PrismaClient) {
    this.service = new GolfPicksService(prisma);
  }

  private isTournamentWindow(): boolean {
    const now = new Date();
    const day = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 4=Thu, 5=Fri, 6=Sat
    const hour = now.getUTCHours();
    // Refresh Thu (4), Fri (5), Sat (6), Sun (0) between 08:00–22:00 UTC
    const isRoundDay = day === 0 || day === 4 || day === 5 || day === 6;
    return isRoundDay && hour >= 8 && hour < 22;
  }

  async refreshActiveTournament(): Promise<void> {
    try {
      // Find the active tournament
      const { PrismaClient: PC } = await import("@prisma/client");
      const prisma = (this.service as any).prisma as PrismaClient;
      const tournament = await prisma.golfTournamentSetup.findFirst({
        where: { isActive: true },
      });

      if (!tournament) {
        console.log("⛳ Golf scoring: no active tournament, skipping");
        return;
      }

      const { updated } = await this.service.refreshScores(tournament.id);
      console.log(`⛳ Golf scoring: refreshed ${updated} picks for "${tournament.name}"`);
    } catch (err: any) {
      console.error("⛳ Golf scoring error:", err.message);
    }
  }

  startScheduler(intervalMinutes = 20): NodeJS.Timeout {
    console.log(`⛳ Golf scoring scheduler started (every ${intervalMinutes} min, Thu–Sun 08–22 UTC)`);
    return setInterval(async () => {
      if (!this.isTournamentWindow()) {
        return; // Outside tournament hours, skip silently
      }
      console.log("⛳ Running scheduled golf score refresh…");
      await this.refreshActiveTournament();
    }, intervalMinutes * 60 * 1000);
  }
}
