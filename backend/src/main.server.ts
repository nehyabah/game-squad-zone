import { buildApp } from './app';
import process from 'node:process';

/**
 * HTTP server entrypoint.
 */
export async function startServer() {
  const app = buildApp();
  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: '0.0.0.0' });
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
