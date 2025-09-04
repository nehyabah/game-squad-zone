// backend/src/server.azure.js
const { buildApp } = require("./app");

async function start() {
  const app = buildApp();
  const port = process.env.PORT || 8080;

  await app.listen({
    port: Number(port),
    host: "0.0.0.0",
  });
  console.log(`Fastify server running on port ${port}`);
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
