// Combined app.js - serves both API and frontend
const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');

// Register plugins
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  exposedHeaders: ['Set-Cookie'],
});

fastify.register(require('@fastify/helmet'), {
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// Serve static files from public directory
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});

// API routes - mount your existing API routes here
fastify.register(async function (fastify) {
  // Import and register your API routes
  const { buildApp } = require('./dist/src/app');
  const apiApp = buildApp();
  
  // Mount API routes under /api prefix
  fastify.register(apiApp, { prefix: '/api' });
}, { prefix: '/api' });

// Catch-all route for SPA - serve index.html for non-API routes
fastify.setNotFoundHandler(async (request, reply) => {
  // If it's an API route, return 404
  if (request.url.startsWith('/api/')) {
    reply.code(404).send({ error: 'API endpoint not found' });
    return;
  }
  
  // For all other routes, serve the SPA
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    reply.type('text/html').sendFile('index.html');
  } else {
    reply.code(404).send({ error: 'Page not found' });
  }
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();