import { buildApp } from "./app";
import "dotenv/config";

const PORT = process.env.PORT || 3001;

async function main() {
  // Build the Fastify app with all routes and plugins
  const app = buildApp();

  try {
    // IMPORTANT: Wait for all plugins to be registered
    await app.ready();

    // Start listening for requests
    await app.listen({ port: Number(PORT), host: "0.0.0.0" });

    // Log startup information
    app.log.info(`Server listening on http://localhost:${PORT}`);
    app.log.info(`Stripe integration enabled`);
    app.log.info(`CORS enabled for all origins (development mode)`);
    app.log.info(`Environment: ${process.env.NODE_ENV || "development"}`);

    // Log available endpoints
    app.log.info(`📍 Available endpoints:`);
    app.log.info(`   GET  http://localhost:${PORT}/health`);
    app.log.info(`   POST http://localhost:${PORT}/api/checkout/sessions`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Start the server
main().catch((err) => {
  console.error("Fatal error during startup:", err);
  process.exit(1);
});
