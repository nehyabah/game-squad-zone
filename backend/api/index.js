// backend/api/index.js
const { buildApp } = require('../dist/app.js');

let app;

module.exports = async (req, res) => {
  // Set CORS headers immediately
  const origin = req.headers.origin;
  
  // Add your frontend domains
  const allowedOrigins = [
    'https://www.squadpot.dev',
    'https://squadpot.dev',
    'https://sqpbackend.vercel.app',
    'https://game-squad-zone-94o5.vercel.app',
    'https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080'
  ];
  
  if (origin && (allowedOrigins.includes(origin) || true)) { // true for testing
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-user-id');
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Initialize app if needed
  if (!app) {
    app = buildApp();
    await app.ready();
  }
  
  // Let Fastify handle the request
  await app.server.emit('request', req, res);
};