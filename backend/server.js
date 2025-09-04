// Simple Node.js server for Azure App Service
const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoints
  if (req.url === '/health' || req.url === '/api/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'SquadPot Backend is running',
      timestamp: new Date().toISOString(),
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    }));
    return;
  }
  
  // Auth0 login endpoint
  if (req.url === '/api/auth/login' && req.method === 'GET') {
    const domain = 'dev-xfta2nvjhpm5pku5.us.auth0.com';
    const clientId = 'uBX39CJShJPMpgtLH9drNZkMaPsMVM7V';
    const redirectUri = 'https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net/auth/callback';
    
    const authUrl = 
      `https://${domain}/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=openid profile email`;
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ authUrl }));
    return;
  }
  
  // Auth0 token exchange endpoint
  if (req.url === '/api/auth/okta/exchange' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      accessToken: 'test-token-' + Date.now(),
      refreshToken: 'test-refresh-' + Date.now(),
      message: 'Authentication successful'
    }));
    return;
  }
  
  // Get current user endpoint
  if (req.url === '/api/auth/me' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: 'test-user-1',
      email: 'test@squadpot.dev',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      emailVerified: true,
      status: 'active'
    }));
    return;
  }
  
  // Squads endpoint
  if (req.url === '/api/squads' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }
  
  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});