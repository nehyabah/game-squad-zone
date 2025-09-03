// Simple backend with direct PostgreSQL - no ORM overhead
const Fastify = require('fastify');
const { Pool } = require('pg');
const cors = require('@fastify/cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🚀 Starting PostgreSQL backend...');
console.log('Node version:', process.version);
console.log('PORT:', process.env.PORT || 'NOT SET');

// Initialize Fastify
const fastify = Fastify({
  logger: true,
  trustProxy: true
});

// Initialize PostgreSQL connection pool
let pool = null;
let dbConnected = false;

// Only connect to database if DATABASE_URL is provided
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Required for Azure PostgreSQL
      },
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000, // 5 second connection timeout
    });
    
    // Test the connection but don't block startup
    pool.query('SELECT NOW()', (err, result) => {
      if (err) {
        fastify.log.warn('⚠️ Database connection failed:', err.message);
        dbConnected = false;
      } else {
        fastify.log.info('✅ Database connected at:', result.rows[0].now);
        dbConnected = true;
        initializeTables(); // Create tables if they don't exist
      }
    });
  } catch (error) {
    fastify.log.warn('⚠️ Database initialization failed:', error.message);
  }
} else {
  fastify.log.warn('⚠️ No DATABASE_URL provided, running without database');
}

// Register CORS
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || true,
  credentials: true
});

// Initialize database tables (simplified schema)
async function initializeTables() {
  if (!pool) return;
  
  const queries = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Squads table
    `CREATE TABLE IF NOT EXISTS squads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      owner_id UUID REFERENCES users(id),
      max_members INTEGER DEFAULT 10,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Squad members table
    `CREATE TABLE IF NOT EXISTS squad_members (
      squad_id UUID REFERENCES squads(id),
      user_id UUID REFERENCES users(id),
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (squad_id, user_id)
    )`
  ];
  
  for (const query of queries) {
    try {
      await pool.query(query);
    } catch (error) {
      fastify.log.warn('Table creation warning:', error.message);
    }
  }
  
  fastify.log.info('✅ Database tables initialized');
}

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: process.env.PORT,
    database: dbConnected ? 'connected' : 'disconnected'
  };
});

// Database health check
fastify.get('/api/health', async (request, reply) => {
  if (!pool) {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'not configured',
      message: 'Running without database'
    };
  }
  
  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as database');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      details: result.rows[0]
    };
  } catch (error) {
    reply.code(200); // Still return 200 so app doesn't appear down
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error.message
    };
  }
});

// Root endpoint
fastify.get('/', async (request, reply) => {
  return {
    name: 'SquadPot Backend (PostgreSQL)',
    version: '1.0.2',
    status: 'running',
    database: dbConnected ? 'connected' : 'disconnected'
  };
});

// Example API endpoints

// Get all users
fastify.get('/api/users', async (request, reply) => {
  if (!pool || !dbConnected) {
    return { error: 'Database not available', users: [] };
  }
  
  try {
    const result = await pool.query('SELECT id, email, username, created_at FROM users');
    return { users: result.rows };
  } catch (error) {
    fastify.log.error('Error fetching users:', error);
    reply.code(500);
    return { error: 'Failed to fetch users' };
  }
});

// Create a user
fastify.post('/api/users', async (request, reply) => {
  if (!pool || !dbConnected) {
    reply.code(503);
    return { error: 'Database not available' };
  }
  
  const { email, username } = request.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO users (email, username) VALUES ($1, $2) RETURNING *',
      [email, username]
    );
    reply.code(201);
    return { user: result.rows[0] };
  } catch (error) {
    fastify.log.error('Error creating user:', error);
    reply.code(400);
    return { error: error.message };
  }
});

// Get all squads
fastify.get('/api/squads', async (request, reply) => {
  if (!pool || !dbConnected) {
    return { error: 'Database not available', squads: [] };
  }
  
  try {
    const result = await pool.query(`
      SELECT s.*, COUNT(sm.user_id) as member_count 
      FROM squads s 
      LEFT JOIN squad_members sm ON s.id = sm.squad_id 
      GROUP BY s.id
    `);
    return { squads: result.rows };
  } catch (error) {
    fastify.log.error('Error fetching squads:', error);
    reply.code(500);
    return { error: 'Failed to fetch squads' };
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
    fastify.log.info(`🗄️ Database: ${dbConnected ? 'Connected' : 'Not connected'}`);
  } catch (err) {
    fastify.log.error('❌ Server startup failed:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Shutting down gracefully...');
  if (pool) await pool.end();
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('Shutting down gracefully...');
  if (pool) await pool.end();
  await fastify.close();
  process.exit(0);
});

// Start the server
start();