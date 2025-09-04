// Azure App Service startup file
// This file helps Azure properly start the Node.js application

console.log('🚀 Starting SquadPot Backend on Azure App Service...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || 8080);

// Start the main server
require('./dist/src/main.server.js');