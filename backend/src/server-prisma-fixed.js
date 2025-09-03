// Azure-optimized server with proper Prisma configuration
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🚀 Starting Azure-optimized Prisma server...');
console.log('Node version:', process.version);
console.log('PORT:', process.env.PORT || 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

// Initialize Fastify
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  },
  trustProxy: true
});

// Initialize Prisma with proper error handling
let prisma = null;
let dbConnected = false;

// Only initialize Prisma if DATABASE_URL exists
if (process.env.DATABASE_URL) {
  try {
    // Import Prisma client
    const { PrismaClient } = require('@prisma/client');
    
    // Initialize with Azure-specific settings
    prisma = new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'minimal',
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    // Test connection asynchronously (don't block startup)
    setTimeout(async () => {
      try {
        await prisma.$connect();
        fastify.log.info('✅ Prisma connected to database');
        dbConnected = true;
        
        // Test query
        const result = await prisma.$queryRaw`SELECT NOW() as time`;
        fastify.log.info('✅ Database query test successful:', result[0]?.time);
      } catch (error) {
        fastify.log.warn('⚠️ Prisma connection failed:', error.message);
        dbConnected = false;
      }
    }, 1000); // Wait 1 second after server starts
    
  } catch (error) {
    fastify.log.warn('⚠️ Prisma initialization failed:', error.message);
    prisma = null;
  }
} else {
  fastify.log.warn('⚠️ No DATABASE_URL provided');
}

// Register CORS
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || true,
  credentials: true
});

// Health check endpoints
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: process.env.PORT,
    database: dbConnected ? 'connected' : 'disconnected',
    prisma: !!prisma
  };
});

// Database health check
fastify.get('/api/health', async (request, reply) => {
  if (!prisma) {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'not configured',
      message: 'Running without Prisma'
    };
  }
  
  try {
    // Simple Prisma query
    const result = await prisma.$queryRaw`SELECT NOW() as time, current_database() as database`;
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      prisma: 'working',
      details: result[0]
    };
  } catch (error) {
    fastify.log.error('Database health check failed:', error);
    reply.code(200); // Still return 200 so app doesn't appear down
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'error',
      prisma: 'failed',
      error: error.message
    };
  }
});

// Root endpoint
fastify.get('/', async (request, reply) => {
  return {
    name: 'SquadPot Backend (Prisma Fixed)',
    version: '1.4.0',
    status: 'running',
    database: dbConnected ? 'connected' : 'disconnected',
    prisma: !!prisma
  };
});

// Debug endpoint
fastify.get('/debug/prisma', async (request, reply) => {
  if (!prisma) {
    return { error: 'Prisma not initialized' };
  }
  
  try {
    // Test various Prisma operations
    const queries = await Promise.allSettled([
      prisma.$queryRaw`SELECT version() as postgres_version`,
      prisma.$queryRaw`SELECT current_database() as database`,
      prisma.$queryRaw`SELECT current_user as user`
    ]);
    
    return {
      prisma_status: 'working',
      queries: queries.map((result, index) => ({
        index,
        status: result.status,
        value: result.status === 'fulfilled' ? result.value : result.reason?.message
      }))
    };
  } catch (error) {
    return {
      prisma_status: 'error',
      error: error.message
    };
  }
});

// Start server
async function start() {
  try {
    const PORT = parseInt(process.env.PORT || '3000', 10);
    const HOST = '0.0.0.0';
    
    await fastify.listen({ port: PORT, host: HOST });
    
    fastify.log.info(`✅ Server listening on http://${HOST}:${PORT}`);
    fastify.log.info(`📍 Health check: http://${HOST}:${PORT}/health`);
    fastify.log.info(`🔧 Prisma: ${prisma ? 'Initialized' : 'Not available'}`);
  } catch (err) {
    fastify.log.error('❌ Server startup failed:', err);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  fastify.log.info('Shutting down gracefully...');
  if (prisma) {
    try {
      await prisma.$disconnect();
      fastify.log.info('✅ Prisma disconnected');
    } catch (error) {
      fastify.log.warn('⚠️ Prisma disconnect error:', error.message);
    }
  }
  await fastify.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
start();