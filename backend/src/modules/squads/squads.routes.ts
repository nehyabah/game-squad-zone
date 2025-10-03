// src/modules/squads/squads.routes.ts
import { FastifyInstance } from "fastify";
import { SquadService } from "./squads.service";
import {
  createSquadSchema,
  joinSquadSchema,
  updateSquadSchema,
  updateMemberRoleSchema,
} from "./squads.schema";

export default async function squadsRoutes(app: FastifyInstance) {
  const svc = new SquadService(app, app.prisma);

  // Chat routes - inline for now to fix registration issue
  // GET /squads/:squadId/messages - Get squad chat messages
  app.get(
    "/squads/:squadId/messages",
    { preHandler: [app.auth] },
    async (req, reply) => {
      try {
        const { squadId } = req.params as { squadId: string };
        const userId = req.currentUser!.id;

        // Check if user is a member of this squad
        const membership = await app.prisma.squadMember.findUnique({
          where: {
            squadId_userId: {
              squadId,
              userId,
            },
          },
        });

        if (!membership) {
          return reply
            .status(403)
            .send({ error: "You are not a member of this squad" });
        }

        // Get messages from the squad
        const messages = await app.prisma.squadMessage.findMany({
          where: { squadId },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
          take: 100, // Limit to last 100 messages
        });

        // Format messages for frontend
        const formattedMessages = messages.map((msg) => ({
          id: msg.id,
          message: msg.message,
          createdAt: msg.createdAt,
          user: msg.user,
          isCurrentUser: msg.userId === userId,
        }));

        return formattedMessages;
      } catch (error) {
        console.error("Error fetching squad messages:", error);
        return reply.status(500).send({ error: "Failed to fetch messages" });
      }
    }
  );

  // POST /squads/:squadId/messages - Send a message to squad chat
  app.post(
    "/squads/:squadId/messages",
    { preHandler: [app.auth] },
    async (req, reply) => {
      try {
        const { squadId } = req.params as { squadId: string };
        const { message } = req.body as { message: string };
        const userId = req.currentUser!.id;

        if (!message || message.trim().length === 0) {
          return reply.status(400).send({ error: "Message cannot be empty" });
        }

        if (message.length > 1000) {
          return reply
            .status(400)
            .send({ error: "Message too long (max 1000 characters)" });
        }

        // Check if user is a member of this squad
        const membership = await app.prisma.squadMember.findUnique({
          where: {
            squadId_userId: {
              squadId,
              userId,
            },
          },
        });

        if (!membership) {
          return reply
            .status(403)
            .send({ error: "You are not a member of this squad" });
        }

        // Create the message
        const newMessage = await app.prisma.squadMessage.create({
          data: {
            squadId,
            userId,
            message: message.trim(),
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        });

        // Format message for frontend
        const formattedMessage = {
          id: newMessage.id,
          message: newMessage.message,
          createdAt: newMessage.createdAt,
          user: newMessage.user,
          isCurrentUser: true,
        };

        return formattedMessage;
      } catch (error) {
        console.error("Error sending squad message:", error);
        return reply.status(500).send({ error: "Failed to send message" });
      }
    }
  );

  // PUT /squads/:squadId/read - Mark messages as read in a squad
  app.put(
    "/squads/:squadId/read",
    { preHandler: [app.auth] },
    async (req, reply) => {
      try {
        const { squadId } = req.params as { squadId: string };
        const userId = req.currentUser!.id;

        // Check if user is a member of this squad
        const membership = await app.prisma.squadMember.findUnique({
          where: {
            squadId_userId: {
              squadId,
              userId,
            },
          },
        });

        if (!membership) {
          return reply
            .status(403)
            .send({ error: "You are not a member of this squad" });
        }

        // Update the lastReadAt timestamp
        await app.prisma.squadMember.update({
          where: {
            squadId_userId: {
              squadId,
              userId,
            },
          },
          data: {
            lastReadAt: new Date(),
          },
        });

        return { success: true };
      } catch (error) {
        console.error("Error marking messages as read:", error);
        return reply
          .status(500)
          .send({ error: "Failed to mark messages as read" });
      }
    }
  );

  app.get("/squads/test", async (req, reply) => {
    return {
      message: "Squads API is working!",
      timestamp: new Date().toISOString(),
    };
  });

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
            imageUrl: { type: "string", format: "uri" },
            maxMembers: { type: "integer", minimum: 2, maximum: 50 },
            potEnabled: { type: "boolean" },
            potAmount: { type: "number", minimum: 0.01, maximum: 10000 },
            potDeadline: { type: "string", format: "date-time" },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        // Validate with Zod
        const validatedData = createSquadSchema.parse(req.body);

        const userId = req.currentUser!.id;
        const squad = await svc.create(validatedData, userId);
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
            imageUrl: { type: "string", format: "uri" },
            maxMembers: { type: "integer", minimum: 2, maximum: 50 },
            potEnabled: { type: "boolean" },
            potAmount: { type: "number", minimum: 0.01, maximum: 10000 },
            potDeadline: { type: "string", format: "date-time" },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const { id } = req.params as { id: string };
        const validatedData = updateSquadSchema.parse(req.body);
        const userId = req.currentUser!.id;
        const squad = await svc.updateSquadSettings(userId, id, validatedData);
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
            joinCode: { type: "string", minLength: 6, maxLength: 12 },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const body = req.body as any;

        const validatedData = joinSquadSchema.parse(req.body);
        const userId = req.currentUser!.id;
        const squad = await svc.joinSquad(userId, validatedData.joinCode);
        return squad;
      } catch (error) {
        console.log("Join squad error:", error);

        // If already a member, return 409 Conflict with helpful message
        if (
          error instanceof Error &&
          error.message.includes("already part of")
        ) {
          return reply.status(409).send({
            error: error.message,
            code: "ALREADY_MEMBER",
          });
        }

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
      try {
        const { id, userId: targetUserId } = req.params as {
          id: string;
          userId: string;
        };
        const validatedData = updateMemberRoleSchema.parse(req.body);
        const requesterId = req.currentUser!.id;

        const result = await svc.updateMemberRole(
          requesterId,
          id,
          targetUserId,
          validatedData.role
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

  // Remove member from squad (owner only)
  app.delete(
    "/squads/:id/members/:userId",
    { preHandler: [app.auth] },
    async (req, reply) => {
      try {
        const { id, userId: targetUserId } = req.params as {
          id: string;
          userId: string;
        };
        const requesterId = req.currentUser!.id;

        const result = await svc.removeMember(requesterId, id, targetUserId);
        return result;
      } catch (error) {
        return reply.status(403).send({
          error:
            error instanceof Error ? error.message : "Failed to remove member",
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
