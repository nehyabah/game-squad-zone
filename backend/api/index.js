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
  
  // For /api/auth/login, return a proper response
  if (req.url === '/api/auth/login' && req.method === 'GET') {
    // Set status to 200 explicitly
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      authUrl: 'https://dev-okta.com/oauth/authorize',
      message: 'Test response - CORS should be working'
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