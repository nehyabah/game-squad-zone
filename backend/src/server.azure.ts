// Azure App Service optimized server startup
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import "dotenv/config";

const PORT = process.env.PORT || 8080;
const IS_AZURE = process.env.WEBSITE_INSTANCE_ID !== undefined;

async function startServer() {
  console.log("🚀 Starting SquadPot Backend on Azure App Service...");
  console.log("Environment:", process.env.NODE_ENV);
  console.log("Port:", PORT);
  console.log("Is Azure:", IS_AZURE);
  console.log("Database URL exists:", !!process.env.DATABASE_URL);

  // Create minimal Fastify instance
  const app = Fastify({ 
    logger: true,
    trustProxy: true 
  });

  // Register CORS
  await app.register(fastifyCors, {
    origin: true,
    credentials: true
  });

  // Basic health check (no database required)
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    azure: IS_AZURE
  }));

  app.get("/", async () => ({
    message: "SquadPot Backend API",
    status: "running",
    version: "1.0.0"
  }));

  // API health check
  app.get("/api/health", async () => ({
    status: "ok",
    service: "squadpot-backend",
    timestamp: new Date().toISOString()
  }));

  // Delayed Prisma initialization (only for routes that need it)
  let prismaClient: any = null;
  
  app.get("/api/status", async (request, reply) => {
    try {
      if (!prismaClient && process.env.DATABASE_URL) {
        const { PrismaClient } = await import("@prisma/client");
        prismaClient = new PrismaClient();
        await prismaClient.$connect();
      }
      
      const userCount = prismaClient ? await prismaClient.user.count() : 0;
      
      return {
        status: "operational",
        database: prismaClient ? "connected" : "not configured",
        users: userCount
      };
    } catch (error: any) {
      return {
        status: "partial",
        database: "error",
        error: error.message
      };
    }
  });

  // Register full app routes if database is available
  if (process.env.DATABASE_URL) {
    try {
      console.log("Loading full application with database...");
      const { buildApp } = await import("./app");
      const fullApp = buildApp();
      
      // Copy routes from full app
      await app.register(async function (app) {
        fullApp.ready().then(() => {
          console.log("Full app loaded successfully");
        }).catch((err: any) => {
          console.error("Failed to load full app:", err);
        });
      });
    } catch (error) {
      console.error("Failed to load full application:", error);
      console.log("Running in basic mode without database features");
    }
  } else {
    console.log("No DATABASE_URL found, running in basic mode");
  }

  try {
    await app.listen({ port: Number(PORT), host: "0.0.0.0" });
    console.log(`✅ Server listening on port ${PORT}`);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Start server with error handling
startServer().catch((err) => {
  console.error("Fatal error during startup:", err);
  console.error("Stack trace:", err.stack);
  
  // On Azure, exit cleanly to allow restart
  if (IS_AZURE) {
    console.log("Exiting for Azure App Service restart...");
    process.exit(1);
  }
});