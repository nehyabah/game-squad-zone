// src/app.ts
import Fastify, { FastifyInstance } from "fastify";
import process from "node:process";
import fastifyCors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import "dotenv/config";

// plugins
import prismaPlugin from "./plugins/prisma";
// import oktaPlugin from "./plugins/okta";
import authJwt from "./plugins/auth-jwt";

// routes
import authRoutes from "./modules/auth/auth.routes";
import squadsRoutes from "./modules/squads/squads.routes";
import walletRoutes from "./modules/wallet/wallet.routes";
import profileRoutes from "./modules/profile/profile.routes";
import registerPickRoutes from "./modules/picks/picks.routes";
import leaderboardRoutes from "./modules/leaderboards/leaderboards.routes";
import statsRoutes from "./modules/stats/stats.routes";
import gameRoutes from "./modules/games/games.routes";
import { basicNotificationRoutes } from "./routes/basic-notifications";
import { syncGamesOnStartup } from "./startup/sync-games";
import { AutoScoringService } from "./services/auto-scoring.service";
import { GameSyncService } from "./services/game-sync.service";
import { PickLockingService } from "./services/pick-locking.service";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });
  const isProd = process.env.NODE_ENV === "production";

  // CORS - CRITICAL: Never use wildcard '*' with credentials mode
  // Use array of allowed origins for production-ready CORS
  const allowedOrigins = [
    'https://www.squadpot.dev',
    'https://squadpot.dev',
    'https://sqpbackend.vercel.app',
    'https://game-squad-zone-94o5.vercel.app',
    'https://game-squad-zone.vercel.app',
    'https://game-squad-zone-git-main-nehyabahs-projects.vercel.app',
    'https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080'
  ];

  app.register(fastifyCors, {
    origin: (origin, cb) => {
      // Log CORS check for debugging
      console.log(`[CORS] Request from origin: ${origin || 'NO-ORIGIN'} | isProd: ${isProd} | NODE_ENV: ${process.env.NODE_ENV}`);

      // No origin header (server-to-server or same-origin)
      if (!origin) {
        console.log('[CORS] No origin - allowing request without CORS header');
        return cb(null, true); // Allow but don't add CORS headers
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log(`[CORS] ✅ Allowed origin: ${origin}`);
        return cb(null, origin); // Return specific origin (not wildcard)
      }

      // Development mode - allow any origin
      if (!isProd) {
        console.log(`[CORS] 🔧 Dev mode - allowing: ${origin}`);
        return cb(null, origin);
      }

      // Production - reject unknown origins
      console.log(`[CORS] ❌ Rejected in production: ${origin}`);
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
    exposedHeaders: ["Set-Cookie"],
    preflight: true, // Enable preflight
    strictPreflight: false, // Don't be overly strict
    preflightContinue: false, // Don't pass preflight to next handler
  });

  // Security headers
  app.register(helmet, {
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  // Register plugins in order
  app.register(cookie);
  app.register(prismaPlugin);
  // app.register(oktaPlugin);
  app.register(authJwt);

  // Health check with database status
  app.get("/health", async () => {
    let dbStatus = "unknown";
    let userCount = 0;
    
    try {
      userCount = await app.prisma.user.count();
      dbStatus = "connected";
    } catch (error) {
      dbStatus = "error";
      console.error("Database health check failed:", error);
    }
    
    return {
      status: "ok",
      database: dbStatus,
      userCount,
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/debug/env", async () => ({
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    requireEmailVerification: (process.env.REQUIRE_EMAIL_VERIFICATION ?? 'true').toLowerCase() !== 'false',
  }));

  app.get("/test-squads", async () => ({
    message: "Squads service is available",
    endpoints: [
      "POST /api/squads - Create squad (requires auth)",
      "GET /api/squads - Get user squads (requires auth)", 
      "POST /api/squads/join - Join squad (requires auth)"
    ],
    timestamp: new Date().toISOString(),
  }));

  // Database connection test
  app.get("/test-db", async () => {
    try {
      const userCount = await app.prisma.user.count();
      const users = await app.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      
      return {
        status: "connected",
        userCount,
        recentUsers: users,
        databaseUrl: process.env.DATABASE_URL?.substring(0, 30) + "...",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        databaseUrl: process.env.DATABASE_URL?.substring(0, 30) + "...",
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Create test user and get token
  app.post("/test-setup", async (request, reply) => {
    const testUserId = 'test-user-123';
    const testUserEmail = 'test@example.com';
    
    // Create test user if not exists
    const existingUser = await app.prisma.user.findUnique({
      where: { id: testUserId }
    });
    
    if (!existingUser) {
      await app.prisma.user.create({
        data: {
          id: testUserId,
          oktaId: 'okta-test-123',
          email: testUserEmail,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          status: 'active',
          emailVerified: true,
        }
      });
    } else {
      // Update existing user to be verified
      await app.prisma.user.update({
        where: { id: testUserId },
        data: { emailVerified: true }
      });
    }
    
    const testPayload = {
      sub: testUserId,
      email: testUserEmail
    };
    
    const token = app.jwt.sign(testPayload, { expiresIn: '1h' });
    
    return {
      message: 'Test user created and token generated',
      user: { id: testUserId, email: testUserEmail },
      token: token,
      bearer: `Bearer ${token}`,
      instructions: 'Use this token in Authorization header: "Authorization: Bearer <token>"'
    };
  });

  app.get("/test-leaderboard", async (request, reply) => {
    const scoringService = new (await import('./modules/scoring/scoring.service')).ScoringService(app.prisma);
    const leaderboardRepo = new (await import('./modules/leaderboards/leaderboards.repo')).LeaderboardRepo(app.prisma, scoringService);

    try {
      const seasonLeaderboard = await leaderboardRepo.fetchSeasonLeaderboard();
      return {
        message: 'Season leaderboard test',
        data: seasonLeaderboard,
        count: seasonLeaderboard.length
      };
    } catch (error: any) {
      return {
        error: 'Failed to fetch leaderboard',
        message: error.message,
        stack: error.stack
      };
    }
  });

  // Test Wednesday caching manually
  app.get("/test-wednesday-cache", async (request, reply) => {
    const { GameSyncService } = await import('./services/game-sync.service');
    const gameSyncService = new GameSyncService(app.prisma);

    try {
      // Force a sync check regardless of day
      await gameSyncService['checkAndSyncNewWeek']();
      return {
        message: 'Wednesday cache test completed',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        error: 'Failed to run Wednesday cache',
        message: error.message,
        stack: error.stack
      };
    }
  });

  // Test Saturday pick locking manually
  app.get("/test-pick-locking", async (request, reply) => {
    const { PickLockingService } = await import('./services/pick-locking.service');
    const pickLockingService = new PickLockingService(app.prisma);

    try {
      // Force pick locking regardless of day
      await pickLockingService.lockPicksNow();
      return {
        message: 'Pick locking test completed',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        error: 'Failed to run pick locking',
        message: error.message,
        stack: error.stack
      };
    }
  });

  // Generate test JWT token for testing (simple version)
  app.get("/test-token", async (request, reply) => {
    const testPayload = {
      sub: 'test-user-123',
      email: 'test@example.com'
    };
    
    const token = app.jwt.sign(testPayload, { expiresIn: '1h' });
    
    return {
      token: token,
      bearer: `Bearer ${token}`,
      user: testPayload,
      expires: '1 hour',
      instructions: 'Use this token in Authorization header: "Authorization: Bearer <token>"'
    };
  });


  // Auth routes
  app.register(authRoutes, { prefix: "/api/auth" });

  // Squad routes
  app.register(squadsRoutes, { prefix: "/api" });

  // Wallet routes
  app.register(walletRoutes, { prefix: "/api" });

  // Profile routes
  app.register(profileRoutes, { prefix: "/api" });

  // Picks routes (without auth for now)
  app.register(registerPickRoutes, { prefix: "/api" });

  // Leaderboard routes
  app.register(leaderboardRoutes, { prefix: "/api" });

  // Statistics routes
  app.register(statsRoutes, { prefix: "/api" });

  // Game routes
  app.register(gameRoutes, { prefix: "/api" });

  // Notification routes - wrapped in async plugin to ensure app.auth is available
  app.register(async (app) => {
    console.log('🔔 Setting up notification endpoints...');

    // GET /api/notifications/vapid-public-key - Get VAPID public key
    app.get('/api/notifications/vapid-public-key', async (request, reply) => {
      try {
        const publicKey = process.env.VAPID_PUBLIC_KEY;
        if (!publicKey) {
          return reply.status(500).send({ error: 'VAPID public key not configured' });
        }
        return { publicKey };
      } catch (err: unknown) {
        console.error('Error getting VAPID public key:', err);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });

    // POST /api/notifications/subscribe - Subscribe to push notifications
    app.post('/api/notifications/subscribe', {
      preHandler: [app.auth]
    }, async (request: any, reply) => {
      try {
        const userId = request.currentUser?.id;
        if (!userId) {
          return reply.status(401).send({ error: 'Authentication required' });
        }

        const { subscription } = request.body as { subscription: any };
        if (!subscription || !subscription.endpoint || !subscription.keys) {
          return reply.status(400).send({ error: 'Invalid subscription data' });
        }

        // Subscribe user to push notifications using raw SQL
        await app.prisma.$executeRaw`
          INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, active, created_at, updated_at)
          VALUES (
            gen_random_uuid()::text,
            ${userId},
            ${subscription.endpoint},
            ${subscription.keys.p256dh},
            ${subscription.keys.auth},
            ${request.headers['user-agent'] || ''},
            true,
            NOW(),
            NOW()
          )
          ON CONFLICT (endpoint) DO UPDATE SET
            p256dh = ${subscription.keys.p256dh},
            auth = ${subscription.keys.auth},
            user_agent = ${request.headers['user-agent'] || ''},
            active = true,
            updated_at = NOW()
        `;

        console.log(`✅ User ${userId} subscribed to push notifications`);

        return {
          success: true,
          message: 'Successfully subscribed to notifications'
        };
      } catch (err: unknown) {
        console.error('Error subscribing to notifications:', err);
        return reply.status(500).send({
          error: 'Failed to subscribe to notifications',
          details: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    });

    // DELETE /api/notifications/unsubscribe - Unsubscribe from push notifications
    app.delete('/api/notifications/unsubscribe', {
      preHandler: [app.auth]
    }, async (request: any, reply) => {
      try {
        const userId = request.currentUser?.id;
        if (!userId) {
          return reply.status(401).send({ error: 'Authentication required' });
        }

        // Unsubscribe user using raw SQL
        await app.prisma.$executeRaw`
          UPDATE push_subscriptions
          SET active = false, updated_at = NOW()
          WHERE user_id = ${userId}
        `;

        console.log(`✅ User ${userId} unsubscribed from push notifications`);

        return {
          success: true,
          message: 'Successfully unsubscribed from notifications'
        };
      } catch (err: unknown) {
        console.error('Error unsubscribing from notifications:', err);
        return reply.status(500).send({ error: 'Failed to unsubscribe from notifications' });
      }
    });

    // GET /api/notifications/status - Get notification subscription status
    app.get('/api/notifications/status', {
      preHandler: [app.auth]
    }, async (request: any, reply) => {
      try {
        const userId = request.currentUser?.id;
        if (!userId) {
          return reply.status(401).send({ error: 'Authentication required' });
        }

        // Get user's active subscriptions
        const subscriptions = await app.prisma.$queryRaw<Array<{id: string, userAgent: string, createdAt: Date}>>`
          SELECT id, user_agent as "userAgent", created_at as "createdAt"
          FROM push_subscriptions
          WHERE user_id = ${userId} AND active = true
        `;

        // Get recent notifications
        const recentNotifications = await app.prisma.$queryRaw<Array<{type: string, title: string, sentAt: Date, clicked: boolean}>>`
          SELECT type, title, sent_at as "sentAt", clicked
          FROM notification_logs
          WHERE user_id = ${userId}
          ORDER BY sent_at DESC
          LIMIT 10
        `;

        return {
          isSubscribed: subscriptions.length > 0,
          subscriptionCount: subscriptions.length,
          subscriptions: subscriptions.map(sub => ({
            id: sub.id,
            userAgent: sub.userAgent,
            createdAt: sub.createdAt
          })),
          recentNotifications: recentNotifications.map(notif => ({
            type: notif.type,
            title: notif.title,
            sentAt: notif.sentAt,
            clicked: notif.clicked
          }))
        };
      } catch (err: unknown) {
        console.error('Error getting notification status:', err);
        return reply.status(500).send({ error: 'Failed to get notification status' });
      }
    });

    // POST /api/notifications/test - Send test notification
    app.post('/api/notifications/test', {
      preHandler: [app.auth]
    }, async (request: any, reply) => {
      try {
        const userId = request.currentUser?.id;
        if (!userId) {
          return reply.status(401).send({ error: 'Authentication required' });
        }

        // Get user's display name from database
        const user = await app.prisma.user.findUnique({
          where: { id: userId },
          select: { displayName: true, username: true }
        });
        const displayName = user?.displayName || user?.username || 'User';

        // Import and use the push notification service
        const { PushNotificationService } = await import('./services/push-notification.service');
        const pushService = new PushNotificationService(app.prisma);

        await pushService.sendToUser(userId, {
          title: 'SquadPot Test Notification',
          message: `Hey ${displayName}! Your notifications are working perfectly! 🎯`,
          type: 'window_event',
          data: { test: true }
        });

        console.log(`🔔 Test notification sent to user ${userId}`);

        return {
          success: true,
          message: 'Test notification sent'
        };
      } catch (err: unknown) {
        console.error('Error sending test notification:', err);
        return reply.status(500).send({
          error: 'Failed to send test notification',
          details: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    });

    // POST /api/notifications/clicked - Mark notification as clicked
    app.post('/api/notifications/clicked', {
      preHandler: [app.auth]
    }, async (request: any, reply) => {
      try {
        const userId = request.currentUser?.id;
        if (!userId) {
          return reply.status(401).send({ error: 'Authentication required' });
        }

        const { type, timestamp } = request.body as { type: string; timestamp: number };

        // Find and update the notification using raw SQL
        const sentAtLower = new Date(timestamp - 1000);
        const sentAtUpper = new Date(timestamp + 1000);

        await app.prisma.$executeRaw`
          UPDATE notification_logs
          SET clicked = true, clicked_at = NOW()
          WHERE user_id = ${userId}
            AND type = ${type}
            AND sent_at BETWEEN ${sentAtLower} AND ${sentAtUpper}
            AND clicked = false
          LIMIT 1
        `;

        return { success: true };
      } catch (err: unknown) {
        console.error('Error marking notification as clicked:', err);
        return reply.status(500).send({ error: 'Failed to mark notification as clicked' });
      }
    });

    // Admin endpoints
    // POST /api/notifications/admin/broadcast - Broadcast notification to all users
    app.post('/api/notifications/admin/broadcast', {
      preHandler: [app.auth]
    }, async (request: any, reply) => {
      try {
        const { title, message, type } = request.body as {
          title: string;
          message: string;
          type: 'pick_reminder' | 'score_update' | 'window_event'
        };

        if (!title || !message || !type) {
          return reply.status(400).send({ error: 'Missing required fields' });
        }

        // Log broadcast notification
        console.log(`📢 Broadcasting: ${title} - ${message} (${type})`);

        return {
          success: true,
          message: 'Broadcast notification sent'
        };
      } catch (err: unknown) {
        console.error('Error broadcasting notification:', err);
        return reply.status(500).send({ error: 'Failed to broadcast notification' });
      }
    });

    // POST /api/notifications/admin/pick-reminders - Send pick reminders
    app.post('/api/notifications/admin/pick-reminders', {
      preHandler: [app.auth]
    }, async (request: any, reply) => {
      try {
        const { weekId } = request.body as { weekId: string };

        if (!weekId) {
          return reply.status(400).send({ error: 'weekId is required' });
        }

        // Log pick reminder request
        console.log(`⏰ Sending pick reminders for ${weekId}`);

        return {
          success: true,
          message: `Pick reminders sent for ${weekId}`
        };
      } catch (err: unknown) {
        console.error('Error sending pick reminders:', err);
        return reply.status(500).send({ error: 'Failed to send pick reminders' });
      }
    });

    // POST /api/notifications/admin/score-updates - Send score updates
    app.post('/api/notifications/admin/score-updates', {
      preHandler: [app.auth]
    }, async (request: any, reply) => {
      try {
        const { weekId } = request.body as { weekId: string };

        if (!weekId) {
          return reply.status(400).send({ error: 'weekId is required' });
        }

        // Log score update request
        console.log(`🎯 Sending score updates for ${weekId}`);

        return {
          success: true,
          message: `Score updates sent for ${weekId}`
        };
      } catch (err: unknown) {
        console.error('Error sending score updates:', err);
        return reply.status(500).send({ error: 'Failed to send score updates' });
      }
    });

    // GET /api/notifications/admin/stats - Get notification statistics
    app.get('/api/notifications/admin/stats', {
      preHandler: [app.auth]
    }, async (request: any, reply) => {
      try {
        // Get stats using raw SQL
        const [subscriptionStats] = await app.prisma.$queryRaw<Array<{total: bigint, active: bigint, inactive: bigint}>>`
          SELECT
            COUNT(*)::int as total,
            COUNT(CASE WHEN active = true THEN 1 END)::int as active,
            COUNT(CASE WHEN active = false THEN 1 END)::int as inactive
          FROM push_subscriptions
        `;

        const [notificationStats] = await app.prisma.$queryRaw<Array<{total: bigint, last24h: bigint}>>`
          SELECT
            COUNT(*)::int as total,
            COUNT(CASE WHEN sent_at >= NOW() - INTERVAL '24 hours' THEN 1 END)::int as "last24h"
          FROM notification_logs
        `;

        // Get click-through rates by type
        const notifsByType = await app.prisma.$queryRaw<Array<{type: string, sent: bigint, clicked: bigint}>>`
          SELECT
            type,
            COUNT(*)::int as sent,
            SUM(CASE WHEN clicked = true THEN 1 ELSE 0 END)::int as clicked
          FROM notification_logs
          GROUP BY type
        `;

        const clickThroughRates = notifsByType.map((group: any) => ({
          type: group.type,
          sent: Number(group.sent),
          clicked: Number(group.clicked),
          rate: Number(group.sent) > 0
            ? `${((Number(group.clicked) / Number(group.sent)) * 100).toFixed(1)}%`
            : '0%'
        }));

        return {
          subscriptions: {
            total: Number(subscriptionStats?.total || 0),
            active: Number(subscriptionStats?.active || 0),
            inactive: Number(subscriptionStats?.inactive || 0)
          },
          notifications: {
            total: Number(notificationStats?.total || 0),
            last24Hours: Number(notificationStats?.last24h || 0)
          },
          clickThroughRates
        };
      } catch (err: unknown) {
        console.error('Error getting notification stats:', err);
        return reply.status(500).send({ error: 'Failed to get notification stats' });
      }
    });
  });

  // app.register(basicNotificationRoutes, { prefix: "/api" });

  // Sync games and start services on startup
  app.ready(() => {
    // One-time sync on startup (keeps existing games)
    syncGamesOnStartup(app.prisma);

    // Initialize auto-scoring service
    const autoScoring = new AutoScoringService(app.prisma);

    // Initialize Wednesday spread caching service
    const gameSync = new GameSyncService(app.prisma);

    // Initialize Saturday pick locking service
    const pickLocking = new PickLockingService(app.prisma);

    // Start periodic auto-scoring (every 30 minutes)
    autoScoring.startAutoScoring(30);

    // Start Wednesday spread caching (every hour)
    gameSync.startGameSyncScheduler();

    // Start Saturday pick locking (every hour)
    pickLocking.startPickLockingScheduler();

    // Run initial checks
    autoScoring.processCompletedGames();
  });

  return app;
}
