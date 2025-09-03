// Combined server - serves both API and frontend
const path = require('path');
const { buildApp } = require('./dist/src/app');

async function start() {
  const app = buildApp();
  
  // Add static file serving for frontend
  await app.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/',
  });
  
  // Catch-all route for SPA - serve index.html for non-API routes
  app.setNotFoundHandler(async (request, reply) => {
    // If it's an API route, return 404
    if (request.url.startsWith('/api/') || request.url.startsWith('/v1/')) {
      reply.code(404).send({ error: 'API endpoint not found' });
      return;
    }
    
    // For all other routes, serve the SPA
    reply.type('text/html').sendFile('index.html');
  });

  try {
    const port = process.env.PORT || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📱 Frontend: http://localhost:${port}`);
    console.log(`🔌 API: http://localhost:${port}/api`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();