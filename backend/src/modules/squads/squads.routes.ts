// src/modules/squads/squads.routes.ts
import { FastifyInstance } from "fastify";
import { SquadsService } from "./squads.service";

export default async function squadsRoutes(app: FastifyInstance) {
  const svc = new SquadsService(app, app.prisma);

  // Create squad
  app.post(
    "/squads",
    {
      preHandler: [app.auth],
      schema: {
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 100 },
            description: { type: "string", maxLength: 500 },
            imageUrl: { type: "string" },
            potEnabled: { type: "boolean" },
            potAmount: { type: "number", minimum: 0 },
            potDeadline: { type: "string", format: "date-time" },
          },
        },
      },
    },
    async (req, reply) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = req.body as any;
      const userId = req.currentUser!.id;

      try {
        const squad = await svc.createSquad(userId, data);
        return reply.status(201).send(squad);
      } catch (error) {
        return reply.status(400).send({
          error:
            error instanceof Error ? error.message : "Failed to create squad",
        });
      }
    }
  );

  // Get user's squads
  app.get("/squads", { preHandler: [app.auth] }, async (req, reply) => {
    const userId = req.currentUser!.id;

    try {
      const squads = await svc.getUserSquads(userId);
      return squads;
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to fetch squads",
      });
    }
  });

  // Get specific squad
  app.get("/squads/:id", { preHandler: [app.auth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.currentUser!.id;

    try {
      const squad = await svc.getSquad(id, userId);
      return squad;
    } catch (error) {
      return reply.status(404).send({
        error: error instanceof Error ? error.message : "Squad not found",
      });
    }
  });

  // Update squad settings
  app.put(
    "/squads/:id/settings",
    {
      preHandler: [app.auth],
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 100 },
            description: { type: "string", maxLength: 500 },
            imageUrl: { type: "string" },
            potEnabled: { type: "boolean" },
            potAmount: { type: "number", minimum: 0 },
            potDeadline: { type: "string", format: "date-time" },
          },
        },
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = req.body as any;
      const userId = req.currentUser!.id;

      try {
        const squad = await svc.updateSquadSettings(userId, id, data);
        return squad;
      } catch (error) {
        return reply.status(403).send({
          error:
            error instanceof Error ? error.message : "Failed to update squad",
        });
      }
    }
  );

  // Join squad with code
  app.post(
    "/squads/join",
    {
      preHandler: [app.auth],
      schema: {
        body: {
          type: "object",
          required: ["joinCode"],
          properties: {
            joinCode: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (req, reply) => {
      const { joinCode } = req.body as { joinCode: string };
      const userId = req.currentUser!.id;

      try {
        const squad = await svc.joinSquad(userId, joinCode);
        return squad;
      } catch (error) {
        return reply.status(400).send({
          error:
            error instanceof Error ? error.message : "Failed to join squad",
        });
      }
    }
  );

  // Leave squad
  app.delete(
    "/squads/:id/leave",
    { preHandler: [app.auth] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const userId = req.currentUser!.id;

      try {
        const result = await svc.leaveSquad(userId, id);
        return result;
      } catch (error) {
        return reply.status(400).send({
          error:
            error instanceof Error ? error.message : "Failed to leave squad",
        });
      }
    }
  );

  // Update member role (owner only)
  app.put(
    "/squads/:id/members/:userId/role",
    {
      preHandler: [app.auth],
      schema: {
        body: {
          type: "object",
          required: ["role"],
          properties: {
            role: { type: "string", enum: ["admin", "member"] },
          },
        },
      },
    },
    async (req, reply) => {
      const { id, userId: targetUserId } = req.params as {
        id: string;
        userId: string;
      };
      const { role } = req.body as { role: "admin" | "member" };
      const requesterId = req.currentUser!.id;

      try {
        const result = await svc.updateMemberRole(
          requesterId,
          id,
          targetUserId,
          role
        );
        return result;
      } catch (error) {
        return reply.status(403).send({
          error:
            error instanceof Error ? error.message : "Failed to update role",
        });
      }
    }
  );

  // Delete squad (owner only)
  app.delete("/squads/:id", { preHandler: [app.auth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.currentUser!.id;

    try {
      const result = await svc.deleteSquad(userId, id);
      return result;
    } catch (error) {
      return reply.status(403).send({
        error:
          error instanceof Error ? error.message : "Failed to delete squad",
      });
    }
  });

  // Get pot status
  app.get("/squads/:id/pot", { preHandler: [app.auth] }, async (req, reply) => {
    const { id } = req.params as { id: string };

    try {
      const status = await svc.getPotStatus(id);
      return status;
    } catch (error) {
      return reply.status(404).send({
        error: error instanceof Error ? error.message : "Squad not found",
      });
    }
  });

  // Create payment session for squad pot
  app.post(
    "/squads/:id/pot/checkout",
    { preHandler: [app.auth] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const userId = req.currentUser!.id;

      try {
        const session = await svc.createPotPaymentSession(userId, id);
        return session;
      } catch (error) {
        return reply.status(400).send({
          error:
            error instanceof Error
              ? error.message
              : "Failed to create payment session",
        });
      }
    }
  );
}
