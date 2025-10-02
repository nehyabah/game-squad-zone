// Simple Node.js server for Azure App Service
const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);

  // CORS - CRITICAL: Never use wildcard '*' with credentials mode
  const allowedOrigins = [
    'https://www.squadpot.dev',
    'https://squadpot.dev',
    'https://sqpbackend.vercel.app',
    'https://game-squad-zone-94o5.vercel.app',
    'https://game-squad-zone.vercel.app',
    'https://game-squad-zone-git-main-nehyabahs-projects.vercel.app',
    'https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080'
  ];

  const origin = req.headers.origin;
  const isProd = process.env.NODE_ENV === 'production';

  console.log(`[FALLBACK-SERVER] Origin: ${origin || 'NO-ORIGIN'} | isProd: ${isProd}`);

  // Set CORS headers - return specific origin, not wildcard
  if (origin && allowedOrigins.includes(origin)) {
    console.log(`[FALLBACK-SERVER] ✅ Allowed origin: ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin && !isProd) {
    console.log(`[FALLBACK-SERVER] 🔧 Dev mode - allowing: ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    console.log(`[FALLBACK-SERVER] ❌ Rejected: ${origin}`);
    // Don't set CORS header - browser will block
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
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
    const domain = 'squadpot.eu.auth0.com';
    const clientId = 'JCCclRaBKBm1Qr5jYZL7sPdqStRcXyQm';
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
  
  // Auth0 callback endpoint - handles authorization code exchange
  if (req.url.startsWith('/api/auth/callback') && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    if (error) {
      // Redirect to frontend with error
      const frontendUrl = 'https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net';
      res.writeHead(302, {
        'Location': `${frontendUrl}/auth/success?error=${encodeURIComponent(error)}`
      });
      res.end();
      return;
    }
    
    if (!code) {
      // Redirect to frontend with error
      const frontendUrl = 'https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net';
      res.writeHead(302, {
        'Location': `${frontendUrl}/auth/success?error=no_code`
      });
      res.end();
      return;
    }
    
    // In a real implementation, you would exchange the code with Auth0 here
    // For now, generate a test token and redirect to frontend
    const testToken = 'test-token-' + Date.now();
    const frontendUrl = 'https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net';
    
    res.writeHead(302, {
      'Location': `${frontendUrl}/auth/success?token=${testToken}`
    });
    res.end();
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
    // Check for authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Authentication required' }));
      return;
    }
    
    // For now, accept any token that starts with the expected format
    // In production, you would validate this against Auth0
    const token = authHeader.substring(7);
    if (!token) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid token' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: 'test-user-1',
      email: 'test@squadpot.dev',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      emailVerified: true,
      status: 'active',
      displayName: 'Test User',
      createdAt: new Date().toISOString()
    }));
    return;
  }
  
  // Get user stats endpoint
  if (req.url === '/api/auth/me/stats' && req.method === 'GET') {
    // Check for authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Authentication required' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      squads: {
        owned: 0,
        member: 0,
        total: 0
      },
      payments: {
        count: 0,
        totalAmount: 0
      }
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