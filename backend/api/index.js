// backend/api/index.js
module.exports = async (req, res) => {
  // ALWAYS set CORS headers first, no matter what
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-user-id');
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
  
  // Handle preflight OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // For /api/auth/login, return the Auth0 authorization URL
  if (req.url === '/api/auth/login' && req.method === 'GET') {
    const domain = 'dev-xfta2nvjhpm5pku5.us.auth0.com';
    const clientId = 'uBX39CJShJPMpgtLH9drNZkMaPsMVM7V';
    const redirectUri = 'https://www.squadpot.dev/auth/callback'; // Frontend callback URL
    
    const authUrl = 
      `https://${domain}/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=openid profile email`;
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ authUrl }));
    return;
  }
  
  // Handle POST /api/auth/okta/exchange - exchange Auth0 token
  if (req.url === '/api/auth/okta/exchange' && req.method === 'POST') {
    // For now, return test tokens since we can't run the full Fastify app
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      accessToken: 'test-token-' + Date.now(),
      refreshToken: 'test-refresh-' + Date.now(),
      message: 'Test authentication successful'
    }));
    return;
  }
  
  // For all other requests, return a test response
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    message: 'Backend is running!',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  }));
};