// src/modules/golf-picks/golf-picks.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { GolfPicksService } from "./golf-picks.service";

export class GolfPicksController {
  private service: GolfPicksService;

  constructor(prisma: PrismaClient) {
    this.service = new GolfPicksService(prisma);
  }

  // ---- Admin endpoints ----

  async createTournament(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).currentUser;
    if (!user?.isAdmin) return reply.status(403).send({ error: "Admin required" });

    try {
      const data = request.body as {
        tournId: string;
        year: number;
        name: string;
        startDate: string;
        endDate: string;
      };
      const tournament = await this.service.createTournament(data);
      return reply.status(201).send(tournament);
    } catch (error) {
      console.error("Error creating golf tournament:", error);
      return reply.status(500).send({ error: "Failed to create tournament" });
    }
  }

  async getAllTournaments(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).currentUser;
    if (!user?.isAdmin) return reply.status(403).send({ error: "Admin required" });

    try {
      const tournaments = await this.service.getAllTournaments();
      return reply.send(tournaments);
    } catch (error) {
      console.error("Error fetching golf tournaments:", error);
      return reply.status(500).send({ error: "Failed to fetch tournaments" });
    }
  }

  async setActive(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const user = (request as any).currentUser;
    if (!user?.isAdmin) return reply.status(403).send({ error: "Admin required" });

    try {
      const { id } = request.params;
      const tournament = await this.service.setActive(id);
      return reply.send(tournament);
    } catch (error: any) {
      console.error("Error activating golf tournament:", error);
      if (error.message === "Tournament not found") {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: "Failed to activate tournament" });
    }
  }

  async toggleLock(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const user = (request as any).currentUser;
    if (!user?.isAdmin) return reply.status(403).send({ error: "Admin required" });

    try {
      const { id } = request.params;
      const tournament = await this.service.toggleLock(id);
      return reply.send(tournament);
    } catch (error: any) {
      console.error("Error toggling golf tournament lock:", error);
      if (error.message === "Tournament not found") {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: "Failed to toggle lock" });
    }
  }

  async addGroupPlayer(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const user = (request as any).currentUser;
    if (!user?.isAdmin) return reply.status(403).send({ error: "Admin required" });

    try {
      const { id: tournamentId } = request.params;
      const data = request.body as {
        groupNumber: number;
        playerId: string;
        firstName: string;
        lastName: string;
      };
      const player = await this.service.addGroupPlayer({ tournamentId, ...data });
      return reply.status(201).send(player);
    } catch (error: any) {
      console.error("Error adding golf group player:", error);
      if (error.code === "P2002") {
        return reply.status(409).send({ error: "Player already in this group" });
      }
      return reply.status(500).send({ error: "Failed to add player" });
    }
  }

  async removeGroupPlayer(
    request: FastifyRequest<{ Params: { id: string; groupPlayerId: string } }>,
    reply: FastifyReply
  ) {
    const user = (request as any).currentUser;
    if (!user?.isAdmin) return reply.status(403).send({ error: "Admin required" });

    try {
      const { groupPlayerId } = request.params;
      await this.service.removeGroupPlayer(groupPlayerId);
      return reply.status(204).send();
    } catch (error: any) {
      console.error("Error removing golf group player:", error);
      if (error.code === "P2025") {
        return reply.status(404).send({ error: "Player not found" });
      }
      return reply.status(500).send({ error: "Failed to remove player" });
    }
  }

  async getAllPicks(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const user = (request as any).currentUser;
    if (!user?.isAdmin) return reply.status(403).send({ error: "Admin required" });

    try {
      const { id: tournamentId } = request.params;
      const picks = await this.service.getAllPicksForTournament(tournamentId);
      return reply.send(picks);
    } catch (error) {
      console.error("Error fetching golf picks:", error);
      return reply.status(500).send({ error: "Failed to fetch picks" });
    }
  }

  async refreshScores(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const user = (request as any).currentUser;
    if (!user?.isAdmin) return reply.status(403).send({ error: "Admin required" });

    try {
      const { id } = request.params;
      const result = await this.service.refreshScores(id);
      return reply.send(result);
    } catch (error: any) {
      console.error("Error refreshing golf scores:", error);
      if (error.message === "Tournament not found") {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: "Failed to refresh scores" });
    }
  }

  async getSquadPicks(
    request: FastifyRequest<{ Params: { squadId: string } }>,
    reply: FastifyReply
  ) {
    const user = (request as any).currentUser;
    if (!user?.id) return reply.status(401).send({ error: "Unauthorized" });

    try {
      const { squadId } = request.params;
      const data = await this.service.getSquadGolfPicks(squadId);
      if (!data) return reply.status(404).send({ error: "No active tournament" });
      return reply.send(data);
    } catch (error) {
      console.error("Error fetching squad golf picks:", error);
      return reply.status(500).send({ error: "Failed to fetch squad picks" });
    }
  }

  // ---- User endpoints ----

  async getActive(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).currentUser;
    if (!user?.id) return reply.status(401).send({ error: "Unauthorized" });

    try {
      const data = await this.service.getActiveTournamentWithGroups(user.id);
      if (!data) return reply.status(404).send({ error: "No active tournament" });
      return reply.send(data);
    } catch (error) {
      console.error("Error fetching active golf tournament:", error);
      return reply.status(500).send({ error: "Failed to fetch tournament" });
    }
  }

  async submitPicks(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).currentUser;
    if (!user?.id) return reply.status(401).send({ error: "Unauthorized" });

    try {
      const { tournamentId, picks } = request.body as {
        tournamentId: string;
        picks: { groupNumber: number; groupPlayerId: string }[];
      };

      if (!tournamentId || !picks || !Array.isArray(picks)) {
        return reply.status(400).send({ error: "tournamentId and picks array are required" });
      }

      const results = await this.service.upsertPicks(user.id, tournamentId, picks);
      return reply.send({ success: true, picks: results });
    } catch (error: any) {
      console.error("Error submitting golf picks:", error);
      if (error.message === "Tournament is locked") {
        return reply.status(400).send({ error: error.message });
      }
      if (error.message === "Tournament not found") {
        return reply.status(404).send({ error: error.message });
      }
      if (error.message === "One or more players not found in this tournament") {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: "Failed to submit picks" });
    }
  }
}
