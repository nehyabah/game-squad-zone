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

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });
  const isProd = process.env.NODE_ENV === "production";

  // CORS
  app.register(fastifyCors, {
    origin: isProd 
      ? ["https://www.squadpot.dev", "https://squadpot.dev", "https://game-squad-zone-94o5.vercel.app", process.env.FRONTEND_URL!].filter(Boolean)
      : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  app.get("/debug/env", async () => ({
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
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
          authProvider: 'okta',
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

  // Sync games on startup
  app.ready(() => {
    syncGamesOnStartup(app.prisma);
  });

  return app;
}
