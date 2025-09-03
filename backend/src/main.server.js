// main.server.js - Simplified JavaScript version for Azure deployment
// This bypasses TypeScript compilation and gives us direct control

const Fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const sensible = require('@fastify/sensible');
const jwt = require('@fastify/jwt');
const cookie = require('@fastify/cookie');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Prisma with better error handling
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'minimal'
});

// Initialize Fastify with logging
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'production' ? undefined : {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  trustProxy: true, // Required for Azure App Service
});

// Register plugins with async/await and error handling
async function registerPlugins() {
  try {
    await fastify.register(cors, {
      origin: process.env.FRONTEND_URL || true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    });

    await fastify.register(helmet, {
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    });

    await fastify.register(sensible);
    await fastify.register(cookie);
    
    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
      cookie: {
        cookieName: 'token',
        signed: false,
      },
    });

    fastify.log.info('All plugins registered successfully');
  } catch (error) {
    fastify.log.error('Plugin registration failed:', error);
    throw error;
  }
}

// Critical health check endpoints for Azure
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 'not set'
  };
});

fastify.get('/api/health', async (request, reply) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1 as result`;
    return { 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    };
  } catch (error) {
    fastify.log.error('Database health check failed:', error);
    // Return healthy status even if DB fails - app is still running
    reply.code(200);
    return { 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed but app is running'
    };
  }
});

// Root endpoint
fastify.get('/', async (request, reply) => {
  return {
    name: 'SquadPot Backend API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    port: process.env.PORT
  };
});

// Debug endpoint to check environment
fastify.get('/debug/env', async (request, reply) => {
  return {
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    frontendUrl: process.env.FRONTEND_URL
  };
});

// Start the server
async function start() {
  try {
    // Register plugins first
    await registerPlugins();
    
    // Get port from environment (Azure sets this dynamically)
    const PORT = parseInt(process.env.PORT || '3001', 10);
    const HOST = '0.0.0.0'; // Listen on all interfaces for Azure
    
    // Start listening
    await fastify.listen({ port: PORT, host: HOST });
    
    // Log startup information
    fastify.log.info(`🚀 Server listening on http://${HOST}:${PORT}`);
    fastify.log.info(`📍 Health check: http://${HOST}:${PORT}/health`);
    fastify.log.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Test database connection (but don't fail if it doesn't work)
    try {
      await prisma.$connect();
      fastify.log.info('✅ Database connected successfully');
    } catch (dbError) {
      fastify.log.warn('⚠️ Database connection failed, but continuing:', dbError.message);
    }
    
  } catch (err) {
    fastify.log.error('❌ Server startup failed:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
});

// Start the server
start();