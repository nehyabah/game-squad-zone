// src/modules/six-nations/six-nations.routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { SixNationsController } from "./six-nations.controller";
import { EmailNotificationService } from "../../services/email-notification.service";

export default async function sixNationsRoutes(app: FastifyInstance) {
  const controller = new SixNationsController(app.prisma);
  const emailService = new EmailNotificationService(app.prisma);

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

  // Six Nations Statistics endpoints
  app.get("/six-nations/stats/squad/:squadId", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { squadId: string } }>, reply: FastifyReply) => {
    return controller.getSixNationsSquadStats(request, reply);
  });

  app.get("/six-nations/stats/personal/:userId", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    return controller.getSixNationsPersonalStats(request, reply);
  });

  app.get("/six-nations/stats/comparison", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.getSixNationsMemberComparison(request, reply);
  });

  // Leaderboard endpoint
  app.get("/six-nations/leaderboard", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return controller.getLeaderboard(request, reply);
  });

  // ── Public Email Unsubscribe (no auth) ─────────────────────────────

  app.get("/six-nations/email/unsubscribe", async (
    request: FastifyRequest<{ Querystring: { token?: string } }>,
    reply: FastifyReply
  ) => {
    const { token } = request.query;

    if (!token) {
      return reply.type("text/html").send(emailService.buildUnsubscribeHtml(
        false,
        "Missing unsubscribe token. Please use the link from your email."
      ));
    }

    const result = await emailService.unsubscribeUser(token);
    return reply.type("text/html").send(emailService.buildUnsubscribeHtml(
      result.success,
      result.message
    ));
  });

  // ── Email Notification Endpoints ────────────────────────────────────

  app.post("/six-nations/admin/email/round-results", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const adminUserId = (request as any).currentUser?.id;
      if (!adminUserId) return reply.status(401).send({ error: "Unauthorized" });

      const { roundId, recipientFilter, specificUserIds } = request.body as {
        roundId: string;
        recipientFilter?: string;
        specificUserIds?: string[];
      };
      const result = await emailService.sendRoundResults(roundId, adminUserId, recipientFilter as any, specificUserIds);
      return reply.send(result);
    } catch (error: any) {
      console.error("Error sending round results email:", error);
      return reply.status(500).send({ error: error.message || "Failed to send round results email" });
    }
  });

  app.post("/six-nations/admin/email/picks-reminder", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const adminUserId = (request as any).currentUser?.id;
      if (!adminUserId) return reply.status(401).send({ error: "Unauthorized" });

      const { roundId, recipientFilter, specificUserIds } = request.body as {
        roundId: string;
        recipientFilter: string;
        specificUserIds?: string[];
      };
      const result = await emailService.sendPicksOpenReminder(
        roundId,
        recipientFilter as any,
        adminUserId,
        specificUserIds
      );
      return reply.send(result);
    } catch (error: any) {
      console.error("Error sending picks reminder email:", error);
      return reply.status(500).send({ error: error.message || "Failed to send picks reminder email" });
    }
  });

  app.post("/six-nations/admin/email/custom", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const adminUserId = (request as any).currentUser?.id;
      if (!adminUserId) return reply.status(401).send({ error: "Unauthorized" });

      const { subject, body, recipientFilter, roundId, specificUserIds } = request.body as {
        subject: string;
        body: string;
        recipientFilter: string;
        roundId?: string;
        specificUserIds?: string[];
      };
      const result = await emailService.sendCustomAnnouncement(
        subject,
        body,
        recipientFilter as any,
        adminUserId,
        roundId,
        specificUserIds
      );
      return reply.send(result);
    } catch (error: any) {
      console.error("Error sending custom email:", error);
      return reply.status(500).send({ error: error.message || "Failed to send custom email" });
    }
  });

  app.get("/six-nations/admin/email/history", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit, type } = request.query as { limit?: string; type?: string };
      const history = await emailService.getHistory(
        limit ? parseInt(limit, 10) : undefined,
        type
      );
      return reply.send(history);
    } catch (error: any) {
      console.error("Error fetching email history:", error);
      return reply.status(500).send({ error: "Failed to fetch email history" });
    }
  });

  app.get("/six-nations/admin/email/preview-recipients", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { recipientFilter, roundId, specificUserIds } = request.query as {
        recipientFilter: string;
        roundId?: string;
        specificUserIds?: string;
      };

      const userIds = specificUserIds ? specificUserIds.split(",") : undefined;
      const recipients = await emailService.getRecipients(
        recipientFilter as any,
        roundId,
        userIds
      );

      // Count unsubscribed users for admin visibility
      const unsubscribedCount = await app.prisma.user.count({
        where: { status: "active", emailUnsubscribed: true },
      });

      return reply.send({ count: recipients.length, recipients, unsubscribedCount });
    } catch (error: any) {
      console.error("Error previewing recipients:", error);
      return reply.status(500).send({ error: "Failed to preview recipients" });
    }
  });
}
