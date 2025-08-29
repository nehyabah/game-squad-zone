// src/app.ts
import Fastify, { FastifyInstance } from "fastify";
import process from "node:process";
import fastifyCors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import "dotenv/config";

// plugins
import prismaPlugin from "./plugins/prisma";
import oktaPlugin from "./plugins/okta";
import authJwt from "./plugins/auth-jwt";

// routes
import authRoutes from "./modules/auth/auth.routes";
import squadsRoutes from "./modules/squads/squads.routes";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });
  const isProd = process.env.NODE_ENV === "production";

  // CORS
  app.register(fastifyCors, {
    origin: isProd ? [process.env.FRONTEND_URL!] : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
  });

  // Security headers
  app.register(helmet, {
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  // Register plugins in order
  app.register(cookie);
  app.register(prismaPlugin);
  app.register(oktaPlugin);
  app.register(authJwt);

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  // Auth routes
  app.register(authRoutes, { prefix: "/api/auth" });

  // Squad routes
  app.register(squadsRoutes, { prefix: "/api" });

  return app;
}
