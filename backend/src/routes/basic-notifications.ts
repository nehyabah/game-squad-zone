import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PushNotificationService } from "../services/push-notification.service";

export async function basicNotificationRoutes(fastify: FastifyInstance) {
  console.log("Registering notification routes...");

  // Initialize notification service
  const notificationService = new PushNotificationService(fastify.prisma);

  /**
   * Get VAPID public key for frontend
   * This is needed for the browser to subscribe to push notifications
   */
  fastify.get(
    "/notifications/vapid-public-key",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const publicKey = process.env.VAPID_PUBLIC_KEY;

        if (!publicKey) {
          console.error("VAPID_PUBLIC_KEY not configured");
          return reply.status(500).send({
            error: "Push notifications are not configured on the server",
          });
        }

        return { publicKey };
      } catch (err: unknown) {
        console.error("Error getting VAPID public key:", err);
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );

  /**
   * Subscribe to push notifications
   * Stores the push subscription in the database
   */
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  fastify.post(
    "/notifications/subscribe",
    {
      preHandler: [fastify.auth],
    },
    async (request: any, reply: FastifyReply) => {
      try {
        const userId = request.currentUser?.id;
        const body: any = request.body;
        const subscription = body?.subscription;
        const userAgent = request.headers["user-agent"];

        if (!userId) {
          return reply.status(401).send({ error: "Authentication required" });
        }

        if (!subscription || !subscription.endpoint || !subscription.keys) {
          return reply.status(400).send({
            error:
              "Invalid subscription data. Expected: { subscription: { endpoint, keys: { p256dh, auth } } }",
          });
        }

        // Validate subscription keys
        if (!subscription.keys.p256dh || !subscription.keys.auth) {
          return reply.status(400).send({
            error: "Missing subscription keys (p256dh or auth)",
          });
        }

        // Subscribe user to push notifications
        await notificationService.subscribe(userId, subscription, userAgent);

        console.log(`User ${userId} subscribed to push notifications`);

        return {
          success: true,
          message: "Successfully subscribed to notifications",
        };
      } catch (err: unknown) {
        console.error("Error subscribing to notifications:", err);
        return reply.status(500).send({
          error: "Failed to subscribe to notifications",
          details: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  );

  /**
   * Unsubscribe from push notifications
   * Marks all user's subscriptions as inactive
   */
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  fastify.delete(
    "/notifications/unsubscribe",
    {
      preHandler: [fastify.auth],
    },
    async (request: any, reply: FastifyReply) => {
      try {
        const userId = request.currentUser?.id;

        if (!userId) {
          return reply.status(401).send({ error: "Authentication required" });
        }

        await notificationService.unsubscribe(userId);

        console.log(`User ${userId} unsubscribed from push notifications`);

        return {
          success: true,
          message: "Successfully unsubscribed from notifications",
        };
      } catch (err: unknown) {
        console.error("Error unsubscribing from notifications:", err);
        return reply.status(500).send({
          error: "Failed to unsubscribe from notifications",
          details: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  );

  /**
   * Get user's notification status
   * Returns subscription info and recent notification history
   */
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  fastify.get(
    "/notifications/status",
    {
      preHandler: [fastify.auth],
    },
    async (request: any, reply: FastifyReply) => {
      try {
        const userId = request.currentUser?.id;

        if (!userId) {
          return reply.status(401).send({ error: "Authentication required" });
        }

        // Get user's active subscriptions
        const subscriptions = await fastify.prisma.pushSubscription.findMany({
          where: {
            userId,
            active: true,
          },
          select: {
            id: true,
            endpoint: true,
            userAgent: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        // Get recent notifications (last 10)
        const recentNotifications =
          await fastify.prisma.notificationLog.findMany({
            where: { userId },
            orderBy: { sentAt: "desc" },
            take: 10,
            select: {
              id: true,
              type: true,
              title: true,
              message: true,
              sentAt: true,
            },
          });

        return {
          isSubscribed: subscriptions.length > 0,
          subscriptionCount: subscriptions.length,
          subscriptions: subscriptions.map((sub) => ({
            id: sub.id,
            endpoint: sub.endpoint,
            userAgent: sub.userAgent,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
          })),
          recentNotifications,
        };
      } catch (err: unknown) {
        console.error("Error getting notification status:", err);
        return reply.status(500).send({
          error: "Failed to get notification status",
          details: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  );

  /**
   * Send test notification
   * Useful for testing if push notifications are working
   */
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  fastify.post(
    "/notifications/test",
    {
      preHandler: [fastify.auth],
    },
    async (request: any, reply: FastifyReply) => {
      try {
        const userId = request.currentUser?.id;

        if (!userId) {
          return reply.status(401).send({ error: "Authentication required" });
        }

        // Check if user has active subscriptions
        const hasSubscriptions = await fastify.prisma.pushSubscription.count({
          where: {
            userId,
            active: true,
          },
        });

        if (hasSubscriptions === 0) {
          return reply.status(400).send({
            error:
              "No active subscriptions found. Please subscribe to notifications first.",
          });
        }

        // Send test notification
        const success = await notificationService.sendTestNotification(userId);

        if (!success) {
          return reply.status(500).send({
            error:
              "Test notification failed to send. Check server logs for details.",
          });
        }

        console.log(`Test notification sent to user ${userId}`);

        return {
          success: true,
          message: "Test notification sent successfully. Check your device!",
        };
      } catch (err: unknown) {
        console.error("Error sending test notification:", err);
        return reply.status(500).send({
          error: "Failed to send test notification",
          details: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  );

  /**
   * Get notification history (paginated)
   */
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  fastify.get(
    "/notifications/history",
    {
      preHandler: [fastify.auth],
    },
    async (request: any, reply: FastifyReply) => {
      try {
        const userId = request.currentUser?.id;
        const { page = 1, limit = 20 } = request.query as any;

        if (!userId) {
          return reply.status(401).send({ error: "Authentication required" });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const [notifications, total] = await Promise.all([
          fastify.prisma.notificationLog.findMany({
            where: { userId },
            orderBy: { sentAt: "desc" },
            skip,
            take,
            select: {
              id: true,
              type: true,
              title: true,
              message: true,
              sentAt: true,
            },
          }),
          fastify.prisma.notificationLog.count({
            where: { userId },
          }),
        ]);

        return {
          notifications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / take),
          },
        };
      } catch (err: unknown) {
        console.error("Error getting notification history:", err);
        return reply.status(500).send({
          error: "Failed to get notification history",
          details: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  );

  /**
   * Delete a specific subscription by endpoint
   */
  fastify.delete(
    "/notifications/subscriptions/:subscriptionId",
    {
      preHandler: [fastify.auth],
    },
    async (request: any, reply: FastifyReply) => {
      try {
        const userId = request.currentUser?.id;
        const { subscriptionId } = request.params;

        if (!userId) {
          return reply.status(401).send({ error: "Authentication required" });
        }

        // Verify subscription belongs to user
        const subscription = await fastify.prisma.pushSubscription.findUnique({
          where: { id: subscriptionId },
        });

        if (!subscription) {
          return reply.status(404).send({ error: "Subscription not found" });
        }

        if (subscription.userId !== userId) {
          return reply
            .status(403)
            .send({ error: "You do not own this subscription" });
        }

        // Mark as inactive
        await fastify.prisma.pushSubscription.update({
          where: { id: subscriptionId },
          data: { active: false },
        });

        console.log(
          `Subscription ${subscriptionId} deleted for user ${userId}`
        );

        return {
          success: true,
          message: "Subscription deleted successfully",
        };
      } catch (err: unknown) {
        console.error("Error deleting subscription:", err);
        return reply.status(500).send({
          error: "Failed to delete subscription",
          details: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  );

  console.log("Notification routes registered successfully");
}
