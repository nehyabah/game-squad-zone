// Test with Fastify only - no database
const Fastify = require('fastify');

console.log('🚀 Starting Fastify-only server...');
console.log('Node version:', process.version);
console.log('PORT:', process.env.PORT || 'NOT SET');

// Initialize Fastify with minimal config
const fastify = Fastify({
  logger: true,
  trustProxy: true // Required for Azure
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    framework: 'fastify',
    timestamp: new Date().toISOString(),
    port: process.env.PORT
  };
});

// Root endpoint
fastify.get('/', async (request, reply) => {
  return {
    name: 'SquadPot Backend (Fastify Only)',
    version: '0.3.1',
    timestamp: new Date().toISOString()
  };
});

// Start server
async function start() {
  try {
    const PORT = parseInt(process.env.PORT || '3000', 10);
    const HOST = '0.0.0.0';
    
    await fastify.listen({ port: PORT, host: HOST });
    
    fastify.log.info(`✅ Fastify server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error('❌ Server startup failed:', err);
    process.exit(1);
  }
}

// Start the server
start();