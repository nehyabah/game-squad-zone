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
import gameRoutes from "./modules/games/games.routes";
import { syncGamesOnStartup } from "./startup/sync-games";
import { AutoScoringService } from "./services/auto-scoring.service";
import { GameSyncService } from "./services/game-sync.service";
import { PickLockingService } from "./services/pick-locking.service";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });
  const isProd = process.env.NODE_ENV === "production";

  // CORS
  app.register(fastifyCors, {
    origin: (origin, cb) => {
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
      
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin) || !isProd) {
        cb(null, true);
      } else {
        cb(null, true); // For now, allow all origins to test
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
    exposedHeaders: ["Set-Cookie"],
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

  // Game routes
  app.register(gameRoutes, { prefix: "/api" });

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
