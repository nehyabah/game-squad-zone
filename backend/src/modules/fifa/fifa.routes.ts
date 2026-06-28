import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { FifaController } from "./fifa.controller";
import { FifaService } from "./fifa.service";

export default async function fifaRoutes(app: FastifyInstance) {
  const controller = new FifaController(app.prisma);

  // Seed the 7 fixed rounds on startup if they don't exist yet
  const service = new FifaService(app.prisma);
  await service.seedRounds();

  // ── Rounds (no create/delete — fixed 7 rounds) ───────────────────────
  app.get("/fifa/rounds", { preHandler: [app.auth] }, (req, reply) => controller.getAllRounds(req, reply));
  app.put("/fifa/rounds/:id", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { id: string } }>, reply) => controller.updateRound(req, reply));
  app.patch("/fifa/rounds/:id/activate", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { id: string } }>, reply) => controller.activateRound(req, reply));
  app.patch("/fifa/rounds/:id/deactivate", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { id: string } }>, reply) => controller.deactivateRound(req, reply));
  app.patch("/fifa/rounds/:id/lock", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { id: string } }>, reply) => controller.lockRound(req, reply));
  app.patch("/fifa/rounds/:id/unlock", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { id: string } }>, reply) => controller.unlockRound(req, reply));

  // ── Matches (Round 2–6 only) ─────────────────────────────────────────
  app.get("/fifa/matches", { preHandler: [app.auth] }, (req, reply) => controller.getAllMatches(req, reply));
  app.get("/fifa/admin/matches", { preHandler: [app.auth] }, (req, reply) => controller.getAllMatchesAdmin(req, reply));
  app.post("/fifa/matches", { preHandler: [app.auth] }, (req, reply) => controller.createMatch(req, reply));
  app.put("/fifa/matches/:id", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { id: string } }>, reply) => controller.updateMatch(req, reply));
  app.delete("/fifa/matches/:id", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { id: string } }>, reply) => controller.deleteMatch(req, reply));
  app.patch("/fifa/matches/:id/score", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { id: string } }>, reply) => controller.updateMatchScore(req, reply));

  // ── Questions ────────────────────────────────────────────────────────
  app.get("/fifa/questions", { preHandler: [app.auth] }, (req, reply) => controller.getAllQuestions(req, reply));
  app.get("/fifa/admin/questions", { preHandler: [app.auth] }, (req, reply) => controller.getAllQuestionsAdmin(req, reply));
  app.post("/fifa/questions", { preHandler: [app.auth] }, (req, reply) => controller.createQuestion(req, reply));
  app.put("/fifa/questions/:id", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { id: string } }>, reply) => controller.updateQuestion(req, reply));
  app.delete("/fifa/questions/:id", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { id: string } }>, reply) => controller.deleteQuestion(req, reply));
  app.patch("/fifa/questions/:id/answer", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { id: string } }>, reply) => controller.setCorrectAnswer(req, reply));
  app.delete("/fifa/questions/:id/answer", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { id: string } }>, reply) => controller.clearCorrectAnswer(req, reply));

  // ── Answers ──────────────────────────────────────────────────────────
  app.post("/fifa/answers", { preHandler: [app.auth] }, (req, reply) => controller.submitAnswers(req, reply));
  app.get("/fifa/answers", { preHandler: [app.auth] }, (req, reply) => controller.getUserAnswers(req, reply));
  app.get("/fifa/answers/user/:userId", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { userId: string } }>, reply) => controller.getSpecificUserAnswers(req, reply));
  app.get("/fifa/rounds/:roundId/member-picks/:userId", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { roundId: string; userId: string } }>, reply) => controller.getMatchPickStatus(req, reply));

  // ── Leaderboard / Stats ──────────────────────────────────────────────
  app.get("/fifa/leaderboard", { preHandler: [app.auth] }, (req, reply) => controller.getLeaderboard(req, reply));
  app.get("/fifa/stats/round-breakdown/:userId", { preHandler: [app.auth] }, (req: FastifyRequest<{ Params: { userId: string } }>, reply) => controller.getUserRoundBreakdown(req, reply));

  // ── Audit Log ────────────────────────────────────────────────────────
  app.get("/fifa/admin/audit-log", { preHandler: [app.auth] }, (req, reply) => controller.getAuditLog(req, reply));
}
