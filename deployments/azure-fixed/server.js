// Azure App Service Server
require('dotenv').config();
const path = require('path');

async function start() {
  try {
    console.log('🚀 Starting Azure App Service...');
    console.log('Node version:', process.version);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Port:', process.env.PORT || 8080);
    
    // Check if backend dist exists
    const backendAppPath = path.join(__dirname, 'backend', 'dist', 'src', 'app.js');
    console.log('Looking for backend app at:', backendAppPath);
    
    const fs = require('fs');
    if (!fs.existsSync(backendAppPath)) {
      console.error('❌ Backend dist not found. Trying to build...');
      
      // Try alternative paths
      const altPath = path.join(__dirname, 'dist', 'src', 'app.js');
      if (fs.existsSync(altPath)) {
        console.log('✅ Found backend at alternative path:', altPath);
        const { buildApp } = require(altPath);
        const app = await setupApp(buildApp());
        await startServer(app);
        return;
      }
      
      throw new Error('Backend application not found. Please ensure the backend is built.');
    }
    
    const { buildApp } = require(backendAppPath);
    const app = await setupApp(buildApp());
    await startServer(app);
    
  } catch (error) {
    console.error('❌ Startup error:', error);
    console.error('Stack:', error.stack);
    
    // Start diagnostic server as fallback
    console.log('🔧 Starting diagnostic mode...');
    startDiagnosticServer();
  }
}

async function setupApp(app) {
  // Register static file serving for frontend
  await app.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/',
    decorateReply: false
  });
  
  // Health check endpoint
  app.get('/health', async (request, reply) => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    };
  });
  
  // Catch-all route for SPA
  app.setNotFoundHandler(async (request, reply) => {
    // API routes should return 404
    if (request.url.startsWith('/api/') || request.url.startsWith('/v1/')) {
      reply.code(404).send({ error: 'API endpoint not found' });
      return;
    }
    
    // Serve SPA for all other routes
    return reply.type('text/html').sendFile('index.html');
  });
  
  return app;
}

async function startServer(app) {
  const port = process.env.PORT || 8080;
  await app.listen({ port: parseInt(port), host: '0.0.0.0' });
  console.log(`✅ Server running on port ${port}`);
  console.log(`📱 Frontend: https://squadpot-main-hegxbvaubhc8g2a9.northeurope-01.azurewebsites.net/`);
  console.log(`🔌 API: https://squadpot-main-hegxbvaubhc8g2a9.northeurope-01.azurewebsites.net/api`);
}

function startDiagnosticServer() {
  const http = require('http');
  const diagnostics = {
    error: 'Main app failed to start',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    checks: {}
  };
  
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(diagnostics, null, 2));
  });
  
  const port = process.env.PORT || 8080;
  server.listen(port, '0.0.0.0', () => {
    console.log(`🔧 Diagnostic server running on port ${port}`);
  });
}

start();