// Diagnostic server to help troubleshoot deployment issues
const http = require('http');
const path = require('path');

console.log('🚀 Starting diagnostic server...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Environment:', process.env.NODE_ENV);

const diagnostics = {
  timestamp: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform,
  env: process.env.NODE_ENV,
  port: process.env.PORT || 3000,
  checks: {}
};

// Check if required directories exist
try {
  const fs = require('fs');
  diagnostics.checks.distExists = fs.existsSync('./dist');
  diagnostics.checks.publicExists = fs.existsSync('./public');
  diagnostics.checks.prismaExists = fs.existsSync('./prisma');
  diagnostics.checks.envExists = fs.existsSync('./.env');
  
  if (diagnostics.checks.publicExists) {
    diagnostics.checks.indexHtmlExists = fs.existsSync('./public/index.html');
  }
  
  console.log('📁 File system checks:', diagnostics.checks);
} catch (err) {
  console.error('❌ File system check error:', err.message);
  diagnostics.checks.fileSystemError = err.message;
}

// Check environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
diagnostics.checks.envVars = {};
requiredEnvVars.forEach(envVar => {
  diagnostics.checks.envVars[envVar] = process.env[envVar] ? 'SET' : 'MISSING';
});

console.log('🔧 Environment variables:', diagnostics.checks.envVars);

// Try to load dependencies
const dependencies = ['fastify', '@fastify/static', '@prisma/client'];
diagnostics.checks.dependencies = {};

dependencies.forEach(dep => {
  try {
    require.resolve(dep);
    diagnostics.checks.dependencies[dep] = 'OK';
    console.log(`✅ ${dep}: Available`);
  } catch (err) {
    diagnostics.checks.dependencies[dep] = 'MISSING';
    console.error(`❌ ${dep}: Missing`);
  }
});

// Test database connection
async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database connection: OK');
    diagnostics.checks.database = 'OK';
    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    diagnostics.checks.database = `ERROR: ${err.message}`;
  }
}

// Try to start main app
async function tryMainApp() {
  try {
    console.log('🔍 Testing main app import...');
    const { buildApp } = require('./dist/src/app');
    const app = buildApp();
    console.log('✅ Main app import: OK');
    diagnostics.checks.mainApp = 'OK';
    return app;
  } catch (err) {
    console.error('❌ Main app failed:', err.message);
    diagnostics.checks.mainApp = `ERROR: ${err.message}`;
    return null;
  }
}

// Simple HTTP server for diagnostics
const server = http.createServer(async (req, res) => {
  if (req.url === '/diagnostic') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(diagnostics, null, 2));
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Diagnostic Server</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .error { color: red; }
            .success { color: green; }
            .warning { color: orange; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <h1>🔍 App Diagnostic Report</h1>
        <p><strong>Status:</strong> Diagnostic mode active</p>
        <p><strong>Timestamp:</strong> ${diagnostics.timestamp}</p>
        <p><strong>Port:</strong> ${diagnostics.port}</p>
        
        <h2>System Info</h2>
        <p>Node: ${diagnostics.nodeVersion} | Platform: ${diagnostics.platform}</p>
        
        <h2>Checks</h2>
        <pre>${JSON.stringify(diagnostics.checks, null, 2)}</pre>
        
        <h2>Actions</h2>
        <p><a href="/diagnostic">View JSON Report</a></p>
        
        <p><em>Check Azure App Service logs for detailed error messages.</em></p>
    </body>
    </html>
  `);
});

// Start diagnostic server
const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', async () => {
  console.log(`🚀 Diagnostic server running on port ${port}`);
  console.log(`📱 Access: http://localhost:${port}`);
  console.log(`📊 Diagnostic: http://localhost:${port}/diagnostic`);
  
  // Run all checks
  await testDatabase();
  await tryMainApp();
  
  console.log('✅ Diagnostic server ready');
  console.log('Full diagnostic report:', JSON.stringify(diagnostics, null, 2));
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});