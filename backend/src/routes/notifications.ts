import { FastifyInstance } from 'fastify';
import { PushNotificationService } from '../services/push-notification.service';

export async function notificationRoutes(fastify: FastifyInstance) {
  const pushService = new PushNotificationService(fastify.prisma);

  // Get VAPID public key for frontend
  fastify.get('/notifications/vapid-public-key', async (request, reply) => {
    try {
      const publicKey = process.env.VAPID_PUBLIC_KEY;

      if (!publicKey) {
        return reply.status(500).send({ error: 'VAPID public key not configured' });
      }

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
      const userId = request.currentUser!.id;
      const { subscription } = request.body as { subscription: { endpoint: string; keys: { p256dh: string; auth: string; } } };
      const userAgent = request.headers['user-agent'];

      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return reply.status(400).send({ error: 'Invalid subscription data' });
      }

      await pushService.subscribe(userId, subscription, userAgent);

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
      const userId = request.currentUser!.id;

      await pushService.unsubscribe(userId);

      return {
        success: true,
        message: 'Successfully unsubscribed from notifications'
      };
    } catch (error) {
      fastify.log.error('Error unsubscribing from notifications:', error);
      return reply.status(500).send({ error: 'Failed to unsubscribe from notifications' });
    }
  });

  // Test notification (authenticated users only)
  fastify.post('/notifications/test', {
    preHandler: [fastify.auth]
  }, async (request, reply) => {
    try {
      const userId = request.currentUser!.id;
      // Get user's display name from database
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, username: true }
      });
      const displayName = user?.displayName || user?.username || 'User';

      await pushService.sendToUser(userId, {
        title: 'SquadPot Test Notification',
        message: `Hey ${displayName}! Your notifications are working perfectly! 🎯`,
        type: 'window_event',
        data: { test: true }
      });

      return {
        success: true,
        message: 'Test notification sent'
      };
    } catch (error) {
      fastify.log.error('Error sending test notification:', error);
      return reply.status(500).send({ error: 'Failed to send test notification' });
    }
  });

  // Get user's notification status
  fastify.get('/notifications/status', {
    preHandler: [fastify.auth]
  }, async (request, reply) => {
    try {
      const userId = request.currentUser!.id;

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

  // Mark notification as clicked (for analytics)
  fastify.post('/notifications/clicked', {
    preHandler: [fastify.auth]
  }, async (request, reply) => {
    try {
      const userId = request.currentUser!.id;
      const body = request.body as { type: string; timestamp: number };
      const { type, timestamp } = body;

      // Find and update the notification log
      await (fastify.prisma as any).notificationLog.updateMany({
        where: {
          userId,
          type,
          sentAt: {
            gte: new Date(timestamp - 5000), // 5 second window
            lte: new Date(timestamp + 5000)
          },
          clicked: false
        },
        data: {
          clicked: true,
          clickedAt: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      fastify.log.error('Error marking notification as clicked:', error);
      return reply.status(500).send({ error: 'Failed to update notification status' });
    }
  });

  // Admin: Send manual notification to all users
  fastify.post('/notifications/admin/broadcast', {
    preHandler: [fastify.auth] // Add admin check here if needed
  }, async (request, reply) => {
    try {
      // TODO: Add admin role check
      // if (request.user.role !== 'admin') {
      //   return reply.status(403).send({ error: 'Admin access required' });
      // }

      const body = request.body as {
        title: string;
        message: string;
        type: 'pick_reminder' | 'score_update' | 'window_event';
      };
      const { title, message, type } = body;

      if (!title || !message || !type) {
        return reply.status(400).send({ error: 'Title, message, and type are required' });
      }

      await pushService.sendToAll({
        title,
        message,
        type,
        data: { admin: true }
      });

      return {
        success: true,
        message: 'Broadcast notification sent to all users'
      };
    } catch (error) {
      fastify.log.error('Error sending broadcast notification:', error);
      return reply.status(500).send({ error: 'Failed to send broadcast notification' });
    }
  });

  // Admin: Send pick reminders
  fastify.post('/notifications/admin/pick-reminders', {
    preHandler: [fastify.auth] // Add admin check here if needed
  }, async (request, reply) => {
    try {
      const body = request.body as { weekId: string };
      const { weekId } = body;

      if (!weekId) {
        return reply.status(400).send({ error: 'weekId is required' });
      }

      await pushService.sendPickReminders(weekId);

      return {
        success: true,
        message: `Pick reminders sent for ${weekId}`
      };
    } catch (error) {
      fastify.log.error('Error sending pick reminders:', error);
      return reply.status(500).send({ error: 'Failed to send pick reminders' });
    }
  });

  // Admin: Send score updates
  fastify.post('/notifications/admin/score-updates', {
    preHandler: [fastify.auth] // Add admin check here if needed
  }, async (request, reply) => {
    try {
      const body = request.body as { weekId: string };
      const { weekId } = body;

      if (!weekId) {
        return reply.status(400).send({ error: 'weekId is required' });
      }

      await pushService.sendScoreUpdates(weekId);

      return {
        success: true,
        message: `Score updates sent for ${weekId}`
      };
    } catch (error) {
      fastify.log.error('Error sending score updates:', error);
      return reply.status(500).send({ error: 'Failed to send score updates' });
    }
  });

  // Admin: Get notification statistics
  fastify.get('/notifications/admin/stats', {
    preHandler: [fastify.auth] // Add admin check here if needed
  }, async (request, reply) => {
    try {
      const [
        totalSubscriptions,
        activeSubscriptions,
        totalNotifications,
        recentNotifications
      ] = await Promise.all([
        (fastify.prisma as any).pushSubscription.count(),
        (fastify.prisma as any).pushSubscription.count({ where: { active: true } }),
        (fastify.prisma as any).notificationLog.count(),
        (fastify.prisma as any).notificationLog.count({
          where: {
            sentAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })
      ]);

      const clickThroughStats = await (fastify.prisma as any).notificationLog.groupBy({
        by: ['type'],
        _count: {
          id: true
        },
        _sum: {
          clicked: true
        }
      });

      return {
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
          inactive: totalSubscriptions - activeSubscriptions
        },
        notifications: {
          total: totalNotifications,
          last24Hours: recentNotifications
        },
        clickThroughRates: clickThroughStats.map(stat => ({
          type: stat.type,
          sent: stat._count.id,
          clicked: stat._sum.clicked || 0,
          rate: stat._count.id > 0 ? ((stat._sum.clicked || 0) / stat._count.id * 100).toFixed(1) : '0.0'
        }))
      };
    } catch (error) {
      fastify.log.error('Error getting notification stats:', error);
      return reply.status(500).send({ error: 'Failed to get notification statistics' });
    }
  });
}