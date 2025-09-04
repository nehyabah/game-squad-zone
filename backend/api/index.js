// backend/api/index.js
// Force redeployment: Updated at 11:05 AM
module.exports = async (req, res) => {
  // ALWAYS set CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-user-id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Try to load and run your app
    const { buildApp } = require('../dist/src/app.js');
    
    // Build app once
    if (!global.app) {
      global.app = buildApp();
      await global.app.ready();
    }
    
    // Pass request to Fastify
    await global.app.server.emit('request', req, res);
    
  } catch (error) {
    console.error('Backend error:', error);
    
    // Return error details for debugging
    res.status(500).json({
      error: 'Backend initialization failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      path: req.url,
      method: req.method
    });
  }
};