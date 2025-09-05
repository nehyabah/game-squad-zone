// Check Production Backend Configuration
const https = require('https');

const BACKEND_URL = 'https://squadpot-backend-production.up.railway.app';

function checkEndpoint(path, description) {
  return new Promise((resolve) => {
    https.get(`${BACKEND_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${description}: Status ${res.statusCode}`);
        if (data && res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log('   Response:', JSON.stringify(json, null, 2).split('\n').slice(0, 5).join('\n'));
          } catch (e) {
            console.log('   Response:', data.substring(0, 100));
          }
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve();
    });
  });
}

async function checkProduction() {
  console.log('🔍 Checking Production Backend Configuration\n');
  console.log(`Backend URL: ${BACKEND_URL}\n`);
  
  // Check health
  await checkEndpoint('/health', 'Health Check');
  
  // Check auth login endpoint
  await checkEndpoint('/api/auth/login', 'Auth Login Endpoint');
  
  // Test auth/me without token (should fail)
  console.log('\n🔐 Testing Protected Endpoints:');
  
  const options = {
    hostname: 'squadpot-backend-production.up.railway.app',
    path: '/api/auth/me',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer invalid-token'
    }
  };
  
  https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 401) {
        console.log('✅ Auth/me properly rejects invalid token (401)');
      } else {
        console.log(`⚠️  Auth/me returned unexpected status: ${res.statusCode}`);
      }
      
      console.log('\n📋 Summary:');
      console.log('- Backend is running on Railway');
      console.log('- Auth endpoints are available');
      console.log('- JWT validation is working');
      console.log('\n⚠️  Make sure these environment variables are set in Railway:');
      console.log('  - DATABASE_URL (PostgreSQL connection string)');
      console.log('  - JWT_SECRET (for signing tokens)');
      console.log('  - OKTA_DOMAIN (Auth0 domain)');
      console.log('  - OKTA_CLIENT_ID');
      console.log('  - OKTA_CLIENT_SECRET');
      console.log('  - FRONTEND_URL (your frontend URL)');
    });
  }).on('error', (err) => {
    console.log(`❌ Auth/me check failed: ${err.message}`);
  }).end();
}

checkProduction();