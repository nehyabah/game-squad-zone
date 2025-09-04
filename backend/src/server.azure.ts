// backend/src/server.azure.ts
import { buildApp } from './app';

const start = async () => {
  const app = buildApp();
  const port = process.env.PORT || 8080;
  
  try {
    await app.listen({ 
      port: Number(port), 
      host: '0.0.0.0'  // Critical for Azure
    });
    console.log(`Server running on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();