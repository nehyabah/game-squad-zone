// src/modules/six-nations/six-nations.routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { SixNationsController } from "./six-nations.controller";

export default async function sixNationsRoutes(app: FastifyInstance) {
  const controller = new SixNationsController(app.prisma);

  // Rounds endpoints
  app.get("/six-nations/rounds", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.getAllRounds(request, reply);
  });

  app.post("/six-nations/rounds", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.createRound(request, reply);
  });

  app.put("/six-nations/rounds/:id", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return controller.updateRound(request, reply);
  });

  app.delete("/six-nations/rounds/:id", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return controller.deleteRound(request, reply);
  });

  app.patch("/six-nations/rounds/:id/activate", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return controller.activateRound(request, reply);
  });

  // Matches endpoints
  app.get("/six-nations/matches", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.getAllMatches(request, reply);
  });

  app.post("/six-nations/matches", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.createMatch(request, reply);
  });

  app.put("/six-nations/matches/:id", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return controller.updateMatch(request, reply);
  });

  app.delete("/six-nations/matches/:id", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return controller.deleteMatch(request, reply);
  });

  app.patch("/six-nations/matches/:id/score", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return controller.updateMatchScore(request, reply);
  });

  // Questions endpoints
  app.get("/six-nations/questions", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.getAllQuestions(request, reply);
  });

  app.post("/six-nations/questions", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.createQuestion(request, reply);
  });

  app.put("/six-nations/questions/:id", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return controller.updateQuestion(request, reply);
  });

  app.delete("/six-nations/questions/:id", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return controller.deleteQuestion(request, reply);
  });

  app.patch("/six-nations/questions/:id/answer", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return controller.setCorrectAnswer(request, reply);
  });

  app.delete("/six-nations/questions/:id/answer", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return controller.clearCorrectAnswer(request, reply);
  });

  // Admin endpoints - view all data regardless of round activation
  app.get("/six-nations/admin/matches", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.getAllMatchesAdmin(request, reply);
  });

  app.get("/six-nations/admin/questions", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.getAllQuestionsAdmin(request, reply);
  });

  // Admin user management
  app.get("/six-nations/admin/users", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.getAdminUsers(request, reply);
  });

  app.get("/six-nations/admin/all-users", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.getAllUsers(request, reply);
  });

  app.post("/six-nations/admin/users/by-email", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.addAdminByEmail(request, reply);
  });

  app.patch("/six-nations/admin/users/:id/admin", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return controller.toggleUserAdmin(request, reply);
  });

  // Audit log endpoints
  app.get("/six-nations/admin/audit-log", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.getAuditLog(request, reply);
  });

  app.get("/six-nations/admin/suspicious-activity", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.getSuspiciousActivity(request, reply);
  });

  // User answers endpoints
  app.post("/six-nations/answers", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.submitAnswers(request, reply);
  });

  app.get("/six-nations/answers", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.getUserAnswers(request, reply);
  });

  // Get any user's answers (for viewing other players' picks)
  app.get("/six-nations/answers/user/:userId", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    return controller.getSpecificUserAnswers(request, reply);
  });

  // Leaderboard endpoint
  app.get("/six-nations/leaderboard", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.getLeaderboard(request, reply);
  });
}
