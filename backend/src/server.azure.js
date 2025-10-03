// backend/src/server.azure.ts
const { buildApp } = require("./app.js");

const start = async () => {
  const app = buildApp();
  const port = process.env.PORT || 8084;

  try {
    await app.listen({
      port: Number(port),
      host: "0.0.0.0",
    });
    console.log(`Server running on port ${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
