// src/modules/squads/chat.routes.ts
import { FastifyInstance } from "fastify";

export default async function chatRoutes(app: FastifyInstance) {
  // GET /squads/:squadId/messages - Get squad chat messages
  app.get("/squads/:squadId/messages", { preHandler: [app.auth] }, async (req, reply) => {
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
        return reply.status(403).send({ error: "You are not a member of this squad" });
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
  });

  // POST /squads/:squadId/messages - Send a message to squad chat
  app.post("/squads/:squadId/messages", { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const { squadId } = req.params as { squadId: string };
      const { message } = req.body as { message: string };
      const userId = req.currentUser!.id;

      if (!message || message.trim().length === 0) {
        return reply.status(400).send({ error: "Message cannot be empty" });
      }

      if (message.length > 1000) {
        return reply.status(400).send({ error: "Message too long (max 1000 characters)" });
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
        return reply.status(403).send({ error: "You are not a member of this squad" });
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
  });

  // DELETE /squads/:squadId/messages/:messageId - Delete a message (only for message author or squad owner)
  app.delete("/squads/:squadId/messages/:messageId", { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const { squadId, messageId } = req.params as { squadId: string; messageId: string };
      const userId = req.currentUser!.id;

      // Get the message to check ownership
      const message = await app.prisma.squadMessage.findUnique({
        where: { id: messageId },
        include: {
          squad: {
            select: { ownerId: true },
          },
        },
      });

      if (!message) {
        return reply.status(404).send({ error: "Message not found" });
      }

      if (message.squadId !== squadId) {
        return reply.status(400).send({ error: "Message does not belong to this squad" });
      }

      // Check if user can delete this message (author or squad owner)
      const canDelete = message.userId === userId || message.squad.ownerId === userId;
      
      if (!canDelete) {
        return reply.status(403).send({ error: "You can only delete your own messages" });
      }

      // Delete the message
      await app.prisma.squadMessage.delete({
        where: { id: messageId },
      });

      return { success: true };
    } catch (error) {
      console.error("Error deleting squad message:", error);
      return reply.status(500).send({ error: "Failed to delete message" });
    }
  });
}