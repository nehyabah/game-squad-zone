import { buildApp } from './app';

/**
 * HTTP server entrypoint.
 */
export async function startServer() {
  const app = buildApp();
  // TODO: start HTTP server and listen on configured port
  return app;
}
