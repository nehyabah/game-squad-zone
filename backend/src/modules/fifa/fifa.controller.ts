import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { FifaService } from "./fifa.service";

export class FifaController {
  private service: FifaService;

  constructor(prisma: PrismaClient) {
    this.service = new FifaService(prisma);
  }

  // ── Rounds (read + edit only) ────────────────────────────────────────

  async getAllRounds(_req: FastifyRequest, reply: FastifyReply) {
    try {
      return reply.send(await this.service.getAllRounds());
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to fetch rounds" });
    }
  }

  async updateRound(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = request.body as { name?: string; lockTime?: string | null };
      return reply.send(await this.service.updateRound(request.params.id, data));
    } catch (e: any) {
      return reply.status(400).send({ error: e.message || "Failed to update round" });
    }
  }

  async activateRound(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      return reply.send(await this.service.activateRound(request.params.id));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to activate round" });
    }
  }

  async deactivateRound(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      return reply.send(await this.service.deactivateRound(request.params.id));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to deactivate round" });
    }
  }

  async lockRound(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      return reply.send(await this.service.lockRound(request.params.id));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to lock round" });
    }
  }

  async unlockRound(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      return reply.send(await this.service.unlockRound(request.params.id));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to unlock round" });
    }
  }

  // ── Matches ──────────────────────────────────────────────────────────

  async getAllMatches(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { roundId } = request.query as { roundId?: string };
      return reply.send(await this.service.getAllMatches(roundId));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to fetch matches" });
    }
  }

  async getAllMatchesAdmin(_req: FastifyRequest, reply: FastifyReply) {
    try {
      return reply.send(await this.service.getAllMatchesAdmin());
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to fetch matches" });
    }
  }

  async createMatch(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as { roundId: string; matchNumber: number; homeTeam: string; awayTeam: string; matchDate: string; venue?: string; groupTeams?: string[] };
      return reply.status(201).send(await this.service.createMatch(data));
    } catch (e: any) {
      return reply.status(400).send({ error: e.message || "Failed to create match" });
    }
  }

  async updateMatch(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = request.body as { matchNumber?: number; homeTeam?: string; awayTeam?: string; matchDate?: string; venue?: string };
      return reply.send(await this.service.updateMatch(request.params.id, data));
    } catch (e: any) {
      return reply.status(400).send({ error: e.message || "Failed to update match" });
    }
  }

  async deleteMatch(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await this.service.deleteMatch(request.params.id);
      return reply.status(204).send();
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to delete match" });
    }
  }

  async updateMatchScore(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { homeScore, awayScore } = request.body as { homeScore: number; awayScore: number };
      const performedBy = (request as any).currentUser?.id || "unknown";
      return reply.send(await this.service.updateMatchScore(request.params.id, homeScore, awayScore, performedBy));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to update score" });
    }
  }

  // ── Questions ────────────────────────────────────────────────────────

  async getAllQuestions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { roundId } = request.query as { roundId?: string };
      return reply.send(await this.service.getAllQuestions(roundId));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to fetch questions" });
    }
  }

  async getAllQuestionsAdmin(_req: FastifyRequest, reply: FastifyReply) {
    try {
      return reply.send(await this.service.getAllQuestionsAdmin());
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to fetch questions" });
    }
  }

  async createQuestion(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as { roundId?: string; matchId?: string; questionNumber: number; questionText: string; questionType: string; options?: string[]; points: number };
      return reply.status(201).send(await this.service.createQuestion(data));
    } catch (e: any) {
      return reply.status(400).send({ error: e.message || "Failed to create question" });
    }
  }

  async updateQuestion(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = request.body as { questionNumber?: number; questionText?: string; questionType?: string; options?: string[]; points?: number };
      return reply.send(await this.service.updateQuestion(request.params.id, data));
    } catch (e: any) {
      return reply.status(400).send({ error: e.message || "Failed to update question" });
    }
  }

  async deleteQuestion(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await this.service.deleteQuestion(request.params.id);
      return reply.status(204).send();
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to delete question" });
    }
  }

  async setCorrectAnswer(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { correctAnswer } = request.body as { correctAnswer: string };
      const performedBy = (request as any).currentUser?.id || "unknown";
      return reply.send(await this.service.setCorrectAnswer(request.params.id, correctAnswer, performedBy));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to set correct answer" });
    }
  }

  async clearCorrectAnswer(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const performedBy = (request as any).currentUser?.id || "unknown";
      return reply.send(await this.service.clearCorrectAnswer(request.params.id, performedBy));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to clear answer" });
    }
  }

  // ── Answers ──────────────────────────────────────────────────────────

  async submitAnswers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).currentUser?.id;
      if (!userId) return reply.status(401).send({ error: "Unauthorized" });
      const { answers } = request.body as { answers: { questionId: string; answer: string }[] };
      const result = await this.service.submitAnswers(userId, answers);
      if (Array.isArray(result)) return reply.send(result);
      return reply.status((result as any).locked?.length > 0 ? 207 : 200).send(result);
    } catch (e: any) {
      return reply.status(400).send({ error: e.message || "Failed to submit answers" });
    }
  }

  async getSpecificUserAnswers(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
    try {
      const requestingUserId = (request as any).currentUser?.id;
      if (!requestingUserId) return reply.status(401).send({ error: "Unauthorized" });
      const { roundId } = request.query as { roundId?: string };
      return reply.send(await this.service.getSpecificUserAnswers(request.params.userId, roundId));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to fetch answers" });
    }
  }

  async getUserAnswers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).currentUser?.id;
      if (!userId) return reply.status(401).send({ error: "Unauthorized" });
      const { roundId } = request.query as { roundId?: string };
      return reply.send(await this.service.getUserAnswers(userId, roundId));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to fetch answers" });
    }
  }

  // ── Leaderboard ──────────────────────────────────────────────────────

  async getLeaderboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { roundId, scope } = request.query as { roundId?: string; scope?: string };
      return reply.send(await this.service.getLeaderboard(roundId, scope));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to fetch leaderboard" });
    }
  }

  async getUserRoundBreakdown(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
    try {
      return reply.send(await this.service.getUserRoundBreakdown(request.params.userId));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to fetch breakdown" });
    }
  }

  // ── Audit Log ────────────────────────────────────────────────────────

  async getAuditLog(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { action, limit } = request.query as { action?: string; limit?: string };
      return reply.send(await this.service.getAuditLog({ action, limit: limit ? parseInt(limit) : undefined }));
    } catch (e: any) {
      return reply.status(500).send({ error: e.message || "Failed to fetch audit log" });
    }
  }
}
