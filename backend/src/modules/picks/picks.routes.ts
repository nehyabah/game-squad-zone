import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { PickController } from "./picks.controller";
import { PickRepo } from "./picks.repo";
import { PickService } from "./picks.service";
import { submitPicksSchema } from "./picks.schema";
import type { SubmitPicksDto } from "./picks.dto";
import { GameRepo } from "../games/games.repo";
import { GameLineRepo } from "../games/game-lines.repo";

interface FastifyWithPrisma extends FastifyInstance {
  prisma: PrismaClient;
}

/**
 * Picks module route registration.
 */
export default async function registerPickRoutes(app: FastifyInstance) {
  const prisma = (app as FastifyWithPrisma).prisma;
  const repo = new PickRepo(prisma);
  const gameRepo = new GameRepo(prisma);
  const gameLineRepo = new GameLineRepo(prisma);
  const service = new PickService(repo, gameRepo, gameLineRepo);
  const controller = new PickController(service);

  app.post(
    "/picks",
    {
      schema: { body: submitPicksSchema },
      preHandler: [app.auth],
    },
    async (req, reply) => {
      return controller.submit(req as any, reply);
    }
  );

  // Add GET endpoint to retrieve user's picks for a week
  app.get(
    "/picks/me",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["weekId"],
          properties: {
            weekId: { type: "string" },
          },
        },
      },
      preHandler: [app.auth],
    },
    async (req: any, reply: FastifyReply) => {
      const userId = req.currentUser!.id;
      const picks = await service.getUserPicks(userId, req.query.weekId);
      if (!picks) {
        return reply.code(404).send({
          type: "https://errors.game-squad-zone/picks-not-found",
          title: "No picks found for this week",
          status: 404,
        });
      }
      return reply.send(picks);
    }
  );

  // Add GET endpoint to retrieve all user's picks history
  app.get(
    "/picks/history",
    { preHandler: [app.auth] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const userId = req.currentUser!.id;
      const history = await service.getUserPickHistory(userId);
      return reply.send(history);
    }
  );

  // Add GET endpoint to retrieve any user's picks for a week
  app.get(
    "/picks/user/:userId",
    {
      schema: {
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string" },
          },
        },
        querystring: {
          type: "object",
          required: ["weekId"],
          properties: {
            weekId: { type: "string" },
          },
        },
      },
      preHandler: [app.auth],
    },
    async (req: any, reply: FastifyReply) => {
      const picks = await service.getUserPicks(
        req.params.userId,
        req.query.weekId
      );
      if (!picks) {
        return reply.code(404).send({
          type: "https://errors.game-squad-zone/picks-not-found",
          title: "No picks found for this week",
          status: 404,
        });
      }
      return reply.send(picks);
    }
  );

  // Add GET endpoint to retrieve any user's complete pick history
  app.get(
    "/picks/user/:userId/history",
    {
      schema: {
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string" },
          },
        },
      },
      preHandler: [app.auth],
    },
    async (req: any, reply: FastifyReply) => {
      const history = await service.getUserPickHistory(req.params.userId);
      return reply.send(history);
    }
  );

  // Add DELETE endpoint to clear picks for a week

  app.delete(
    "/picks/me",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["weekId"],
          properties: {
            weekId: { type: "string" },
          },
        },
      },
      preHandler: [app.auth],
    },

    async (req: any, reply: FastifyReply) => {
      return controller.deletePicks(req, reply);
    }
  );
}
