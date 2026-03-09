// src/modules/golf-picks/golf-picks.routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { GolfPicksController } from "./golf-picks.controller";

export default async function golfPicksRoutes(app: FastifyInstance) {
  const controller = new GolfPicksController(app.prisma);

  // ---- Admin endpoints ----

  app.post(
    "/golf-picks/admin/tournament",
    { preHandler: [app.auth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return controller.createTournament(request, reply);
    }
  );

  app.get(
    "/golf-picks/admin/tournaments",
    { preHandler: [app.auth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return controller.getAllTournaments(request, reply);
    }
  );

  app.patch(
    "/golf-picks/admin/tournament/:id/activate",
    { preHandler: [app.auth] },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      return controller.setActive(request, reply);
    }
  );

  app.patch(
    "/golf-picks/admin/tournament/:id/lock",
    { preHandler: [app.auth] },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      return controller.toggleLock(request, reply);
    }
  );

  app.post(
    "/golf-picks/admin/tournament/:id/players",
    { preHandler: [app.auth] },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      return controller.addGroupPlayer(request, reply);
    }
  );

  app.delete(
    "/golf-picks/admin/tournament/:id/players/:groupPlayerId",
    { preHandler: [app.auth] },
    async (
      request: FastifyRequest<{ Params: { id: string; groupPlayerId: string } }>,
      reply: FastifyReply
    ) => {
      return controller.removeGroupPlayer(request, reply);
    }
  );

  app.get(
    "/golf-picks/admin/tournament/:id/picks",
    { preHandler: [app.auth] },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      return controller.getAllPicks(request, reply);
    }
  );

  app.get(
    "/golf-picks/squad/:squadId",
    { preHandler: [app.auth] },
    async (
      request: FastifyRequest<{ Params: { squadId: string } }>,
      reply: FastifyReply
    ) => {
      return controller.getSquadPicks(request, reply);
    }
  );

  // ---- User endpoints ----

  app.get(
    "/golf-picks/active",
    { preHandler: [app.auth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return controller.getActive(request, reply);
    }
  );

  app.put(
    "/golf-picks/picks",
    { preHandler: [app.auth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return controller.submitPicks(request, reply);
    }
  );
}
