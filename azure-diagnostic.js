// Azure App Service Diagnostic Tool
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 Azure Diagnostic Tool Starting...');

const diagnostics = {
  timestamp: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform,
  environment: process.env.NODE_ENV,
  port: process.env.PORT || 8080,
  checks: {
    files: {},
    environment: {},
    dependencies: {},
    database: null
  }
};

// File system checks
const criticalPaths = [
  './server.js',
  './dist',
  './dist/src/app.js',
  './public',
  './public/index.html',
  './prisma',
  './node_modules',
  './package.json'
];

console.log('📁 Checking critical files...');
criticalPaths.forEach(filePath => {
  try {
    const exists = fs.existsSync(filePath);
    const stats = exists ? fs.statSync(filePath) : null;
    diagnostics.checks.files[filePath] = {
      exists,
      isDirectory: stats ? stats.isDirectory() : false,
      size: stats ? stats.size : 0
    };
    console.log(`${exists ? '✅' : '❌'} ${filePath}: ${exists ? 'Found' : 'Missing'}`);
  } catch (err) {
    diagnostics.checks.files[filePath] = { error: err.message };
    console.log(`❌ ${filePath}: Error - ${err.message}`);
  }
});

// Environment variable checks
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'OKTA_DOMAIN',
  'OKTA_CLIENT_ID',
  'STRIPE_SECRET_KEY'
];

console.log('🔧 Checking environment variables...');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  diagnostics.checks.environment[envVar] = value ? 'SET' : 'MISSING';
  console.log(`${value ? '✅' : '❌'} ${envVar}: ${value ? 'SET' : 'MISSING'}`);
});

// Dependency checks
const criticalDeps = [
  'fastify',
  '@fastify/static',
  '@prisma/client',
  'bcryptjs',
  'jose'
];

console.log('📦 Checking dependencies...');
criticalDeps.forEach(dep => {
  try {
    require.resolve(dep);
    diagnostics.checks.dependencies[dep] = 'OK';
    console.log(`✅ ${dep}: Available`);
  } catch (err) {
    diagnostics.checks.dependencies[dep] = `ERROR: ${err.message}`;
    console.log(`❌ ${dep}: ${err.message}`);
  }
});

// Test main app import
console.log('🔍 Testing main app import...');
try {
  if (fs.existsSync('./dist/src/app.js')) {
    const { buildApp } = require('./dist/src/app.js');
    console.log('✅ Main app import: SUCCESS');
    diagnostics.checks.mainApp = 'SUCCESS';
  } else {
    console.log('❌ Main app: dist/src/app.js not found');
    diagnostics.checks.mainApp = 'dist/src/app.js not found';
  }
} catch (err) {
  console.log(`❌ Main app import: ${err.message}`);
  diagnostics.checks.mainApp = `ERROR: ${err.message}`;
}

// Database connection test
async function testDatabaseConnection() {
  console.log('🔗 Testing database connection...');
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set');
    }
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database: Connected successfully');
    diagnostics.checks.database = 'SUCCESS';
    await prisma.$disconnect();
  } catch (err) {
    console.log(`❌ Database: ${err.message}`);
    diagnostics.checks.database = `ERROR: ${err.message}`;
  }
}

// HTTP server for diagnostics
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  
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
        <title>Azure Diagnostic Report</title>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; background: #f8f9fa; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #1a365d; margin-bottom: 20px; }
            h2 { color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
            .status { font-size: 18px; margin: 20px 0; }
            .success { color: #22c55e; font-weight: 600; }
            .error { color: #ef4444; font-weight: 600; }
            .warning { color: #f59e0b; font-weight: 600; }
            pre { background: #f7fafc; padding: 15px; border-radius: 6px; overflow-x: auto; border: 1px solid #e2e8f0; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
            .card { background: #f8f9fa; padding: 20px; border-radius: 6px; border: 1px solid #e9ecef; }
            .nav { margin: 20px 0; }
            .nav a { display: inline-block; margin-right: 15px; padding: 8px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔍 Azure App Service Diagnostic Report</h1>
            
            <div class="status">
                <strong>Status:</strong> <span class="${diagnostics.checks.mainApp === 'SUCCESS' ? 'success' : 'error'}">
                    ${diagnostics.checks.mainApp === 'SUCCESS' ? 'Diagnostic Mode - App Import OK' : 'App Import Failed'}
                </span>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>System Info</h3>
                    <p><strong>Node:</strong> ${diagnostics.nodeVersion}</p>
                    <p><strong>Platform:</strong> ${diagnostics.platform}</p>
                    <p><strong>Environment:</strong> ${diagnostics.environment || 'Not Set'}</p>
                    <p><strong>Port:</strong> ${diagnostics.port}</p>
                    <p><strong>Time:</strong> ${diagnostics.timestamp}</p>
                </div>
                
                <div class="card">
                    <h3>Quick Actions</h3>
                    <div class="nav">
                        <a href="/diagnostic">JSON Report</a>
                        <a href="/health">Health Check</a>
                    </div>
                </div>
            </div>
            
            <h2>File System Check</h2>
            <pre>${JSON.stringify(diagnostics.checks.files, null, 2)}</pre>
            
            <h2>Environment Variables</h2>
            <pre>${JSON.stringify(diagnostics.checks.environment, null, 2)}</pre>
            
            <h2>Dependencies</h2>
            <pre>${JSON.stringify(diagnostics.checks.dependencies, null, 2)}</pre>
            
            <h2>Database Connection</h2>
            <pre>${JSON.stringify(diagnostics.checks.database, null, 2)}</pre>
            
            <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px;">
                <h3>🛠️ Troubleshooting Tips</h3>
                <ul>
                    <li>Check Azure App Service logs in the Azure portal</li>
                    <li>Verify all environment variables are set in App Service Configuration</li>
                    <li>Ensure database firewall allows Azure services</li>
                    <li>Confirm all files were uploaded correctly via Kudu console</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Start the diagnostic server
const port = process.env.PORT || 8080;
server.listen(port, '0.0.0.0', async () => {
  console.log(`\n🚀 Azure Diagnostic Server running on port ${port}`);
  console.log(`📊 View report: https://squadpot-main-hegxbvaubhc8g2a9.northeurope-01.azurewebsites.net/`);
  console.log(`📊 JSON data: https://squadpot-main-hegxbvaubhc8g2a9.northeurope-01.azurewebsites.net/diagnostic`);
  
  // Run async checks
  await testDatabaseConnection();
  
  console.log('\n📋 DIAGNOSTIC SUMMARY:');
  console.log('='.repeat(50));
  console.log(JSON.stringify(diagnostics, null, 2));
  console.log('='.repeat(50));
  console.log('✅ Diagnostic server ready for Azure App Service');
});

server.on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});