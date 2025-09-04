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
  
  // For now, return a simple test response to verify CORS is working
  if (req.url === '/api/auth/login' && req.method === 'GET') {
    res.status(200).json({
      authUrl: 'https://dev-okta.com/oauth/authorize',
      message: 'Test response - CORS should be working'
    });
    return;
  }
  
  // Default test response
  res.status(200).json({
    message: 'Backend is running!',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};