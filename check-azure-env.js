// Script to check Azure App Service environment variables
// Run this to verify your Azure app service configuration

const requiredEnvVars = {
  'DATABASE_URL': 'postgresql://bycocjkgpo:Hs@17tyu@squadpot-public-db.postgres.database.azure.com:5432/postgres?sslmode=require',
  'NODE_ENV': 'production',
  'JWT_SECRET': 'jTJo2G1Jx5dEztCxr1S8lSfyuNcJTfqdM6yMLfKAVtk=',
  'PORT': '8080',
  'FRONTEND_URL': 'https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net',
  'VITE_ODDS_API_KEY': '82b581f1329b27928e80ec0b87729921',
  'ALLOWED_ORIGINS': 'https://squadpot-frontend-dvbuhegnfqhkethx.northeurope-01.azurewebsites.net'
};

console.log('=== Required Azure App Service Environment Variables ===\n');
console.log('You need to configure these in your Azure App Service:');
console.log('Go to: Azure Portal > Your App Service > Configuration > Application settings\n');

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  console.log(`Name: ${key}`);
  console.log(`Value: ${value}`);
  console.log('---');
});

console.log('\nAlternatively, you can set them via Azure CLI:');
console.log('\naz webapp config appsettings set \\');
console.log('  --resource-group your-resource-group \\');
console.log('  --name squadpot-backend-dvbpatdag5a6aqff \\');
console.log('  --settings \\');

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  // Escape quotes for CLI
  const escapedValue = value.replace(/"/g, '\\"');
  console.log(`    "${key}=${escapedValue}" \\`);
});

console.log('\n=== DATABASE_URL Breakdown ===');
console.log('postgresql://username:password@host:port/database?options');
console.log('Username: bycocjkgpo');
console.log('Password: Hs@17tyu');
console.log('Host: squadpot-public-db.postgres.database.azure.com');
console.log('Port: 5432');
console.log('Database: postgres');
console.log('SSL: required');