import { FastifyInstance } from 'fastify';

export async function simpleNotificationRoutes(fastify: FastifyInstance) {
  // Get VAPID public key for frontend
  fastify.get('/notifications/vapid-public-key', async (request, reply) => {
    try {
      const publicKey = process.env.VAPID_PUBLIC_KEY || 'BMqSvZjkdJbXLpa5qOQ_V0KPMRRm_KT7YUCAJPq0-9HsROTlIZdWWRSx5p8WR5Q_-YHj0wjNrKE3lE_rXv6f6VY';
      return { publicKey };
    } catch (error) {
      fastify.log.error('Error getting VAPID public key:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Subscribe to push notifications
  fastify.post('/notifications/subscribe', {
    preHandler: [fastify.auth]
  }, async (request, reply) => {
    try {
      const userId = (request as any).currentUser!.id;
      const body = request.body as any;
      const subscription = body.subscription;
      const userAgent = request.headers['user-agent'];

      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return reply.status(400).send({ error: 'Invalid subscription data' });
      }

      // Store subscription in database
      await (fastify.prisma as any).pushSubscription.upsert({
        where: { endpoint: subscription.endpoint },
        update: {
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          active: true,
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          active: true,
        },
      });

      console.log(`✅ User ${userId} subscribed to push notifications`);

      return {
        success: true,
        message: 'Successfully subscribed to notifications'
      };
    } catch (error) {
      fastify.log.error('Error subscribing to notifications:', error);
      return reply.status(500).send({ error: 'Failed to subscribe to notifications' });
    }
  });

  // Unsubscribe from push notifications
  fastify.delete('/notifications/unsubscribe', {
    preHandler: [fastify.auth]
  }, async (request, reply) => {
    try {
      const userId = (request as any).currentUser!.id;

      await (fastify.prisma as any).pushSubscription.updateMany({
        where: { userId, active: true },
        data: { active: false },
      });

      console.log(`✅ User ${userId} unsubscribed from push notifications`);

      return {
        success: true,
        message: 'Successfully unsubscribed from notifications'
      };
    } catch (error) {
      fastify.log.error('Error unsubscribing from notifications:', error);
      return reply.status(500).send({ error: 'Failed to unsubscribe from notifications' });
    }
  });

  // Get user's notification status
  fastify.get('/notifications/status', {
    preHandler: [fastify.auth]
  }, async (request, reply) => {
    try {
      const userId = (request as any).currentUser!.id;

      const subscriptions = await (fastify.prisma as any).pushSubscription.findMany({
        where: {
          userId,
          active: true
        },
        select: {
          id: true,
          userAgent: true,
          createdAt: true
        }
      });

      const recentLogs = await (fastify.prisma as any).notificationLog.findMany({
        where: { userId },
        orderBy: { sentAt: 'desc' },
        take: 5,
        select: {
          type: true,
          title: true,
          sentAt: true,
          clicked: true
        }
      });

      return {
        isSubscribed: subscriptions.length > 0,
        subscriptionCount: subscriptions.length,
        subscriptions,
        recentNotifications: recentLogs
      };
    } catch (error) {
      fastify.log.error('Error getting notification status:', error);
      return reply.status(500).send({ error: 'Failed to get notification status' });
    }
  });

  // Send test notification
  fastify.post('/notifications/test', {
    preHandler: [fastify.auth]
  }, async (request, reply) => {
    try {
      const userId = (request as any).currentUser!.id;

      // Get user's display name from database
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, username: true }
      });
      const displayName = user?.displayName || user?.username || 'User';

      // Log the test notification
      await (fastify.prisma as any).notificationLog.create({
        data: {
          userId,
          type: 'window_event',
          title: 'SquadPot Test Notification',
          message: `Hey ${displayName}! Your notifications are working perfectly! 🎯`
        }
      });

      console.log(`🔔 Test notification logged for user ${userId}`);

      return {
        success: true,
        message: 'Test notification sent'
      };
    } catch (error) {
      fastify.log.error('Error sending test notification:', error);
      return reply.status(500).send({ error: 'Failed to send test notification' });
    }
  });
}