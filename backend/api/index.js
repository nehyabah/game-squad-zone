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
  
  try {
    // Try to load and initialize the app
    const { buildApp } = require('../dist/app.js');
    
    // Cache the app instance
    if (!global.app) {
      global.app = buildApp();
      await global.app.ready();
    }
    
    // Let Fastify handle the request
    await global.app.server.emit('request', req, res);
  } catch (error) {
    // If there's any error, still return a response with CORS headers
    console.error('Error in api/index.js:', error);
    
    // Return a basic response for testing
    if (req.url === '/api/auth/login' && req.method === 'GET') {
      res.status(200).json({
        authUrl: 'https://dev-okta.com/oauth/authorize',
        message: 'Backend is initializing, please try again'
      });
    } else {
      res.status(500).json({
        error: 'Backend initialization error',
        message: error.message,
        path: req.url,
        method: req.method
      });
    }
  }
};