import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { FastifyInstance } from 'fastify';

/**
 * CORS configuration plugin.
 */
export default fp(async function (fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:3001',
      'http://localhost:8080',
      'https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net',
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
  });
});
