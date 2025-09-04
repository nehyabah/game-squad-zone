// Azure App Service startup file
// This file helps Azure properly start the Node.js application

console.log('🚀 Starting SquadPot Backend on Azure App Service...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || 8080);

// Check if Azure-specific server exists, otherwise use main server
try {
  require('./dist/src/server.azure.js');
} catch (err) {
  console.log('Azure server not found, using main server');
  require('./dist/src/main.server.js');
}