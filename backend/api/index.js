// api/index.js
const { buildApp } = require('../dist/app');

let app;

module.exports = async (req, res) => {
  if (!app) {
    app = buildApp();
    await app.ready();
  }
  
  // Convert Vercel request/response to Fastify format
  await app.server.emit('request', req, res);
};