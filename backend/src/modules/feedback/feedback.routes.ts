import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { FeedbackService } from "./feedback.service";
import { submitFeedbackSchema, updateFeedbackSchema } from "./feedback.schema";

export default async function feedbackRoutes(app: FastifyInstance) {
  const service = new FeedbackService(app.prisma);

  // POST /api/feedback — submit anonymous feedback (auth required to prevent spam)
  app.post("/feedback", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = submitFeedbackSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      // Note: userId is NOT stored — feedback is truly anonymous
      const feedback = await service.submit(parsed.data);
      return reply.status(201).send({ success: true, id: feedback.id });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      return reply.status(500).send({ error: "Failed to submit feedback" });
    }
  });

  // Admin endpoints — require auth + isAdmin check

  // GET /api/feedback/admin — list all feedback
  app.get("/feedback/admin", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await app.prisma.user.findUnique({
        where: { id: request.currentUser!.id },
        select: { isAdmin: true },
      });
      if (!user?.isAdmin) {
        return reply.status(403).send({ error: "Admin access required" });
      }

      const query = request.query as { status?: string; category?: string };
      const feedback = await service.getAll({
        status: query.status,
        category: query.category,
      });
      return reply.send(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      return reply.status(500).send({ error: "Failed to fetch feedback" });
    }
  });

  // GET /api/feedback/admin/stats — feedback counts by status
  app.get("/feedback/admin/stats", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await app.prisma.user.findUnique({
        where: { id: request.currentUser!.id },
        select: { isAdmin: true },
      });
      if (!user?.isAdmin) {
        return reply.status(403).send({ error: "Admin access required" });
      }

      const stats = await service.getStats();
      return reply.send(stats);
    } catch (error) {
      console.error("Error fetching feedback stats:", error);
      return reply.status(500).send({ error: "Failed to fetch feedback stats" });
    }
  });

  // PATCH /api/feedback/admin/:id — update feedback status/notes
  app.patch("/feedback/admin/:id", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await app.prisma.user.findUnique({
        where: { id: request.currentUser!.id },
        select: { isAdmin: true },
      });
      if (!user?.isAdmin) {
        return reply.status(403).send({ error: "Admin access required" });
      }

      const parsed = updateFeedbackSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const feedback = await service.update(request.params.id, parsed.data);
      return reply.send(feedback);
    } catch (error) {
      console.error("Error updating feedback:", error);
      return reply.status(500).send({ error: "Failed to update feedback" });
    }
  });

  // DELETE /api/feedback/admin/:id — delete feedback
  app.delete("/feedback/admin/:id", {
    preHandler: [app.auth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await app.prisma.user.findUnique({
        where: { id: request.currentUser!.id },
        select: { isAdmin: true },
      });
      if (!user?.isAdmin) {
        return reply.status(403).send({ error: "Admin access required" });
      }

      await service.delete(request.params.id);
      return reply.send({ success: true });
    } catch (error) {
      console.error("Error deleting feedback:", error);
      return reply.status(500).send({ error: "Failed to delete feedback" });
    }
  });
}
