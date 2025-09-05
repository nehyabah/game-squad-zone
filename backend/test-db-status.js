// Quick script to test database status
const https = require('https');

const testPayload = {
  code: 'test_auth_code',
  state: 'test_state'
};

const options = {
  hostname: 'squadpot-backend-production.up.railway.app',
  port: 443,
  path: '/api/auth/callback',
  method: 'GET',
  headers: {
    'User-Agent': 'Database-Test/1.0'
  }
};

// Construct query string
const queryString = `code=${testPayload.code}&state=${testPayload.state}`;
options.path = `${options.path}?${queryString}`;

console.log('Testing backend database status via auth callback...');
console.log(`URL: https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', data);
    
    // Parse the response to check for database errors
    try {
      const parsed = JSON.parse(data);
      if (parsed.error && parsed.error.includes('P2032')) {
        console.log('\n❌ DATABASE STILL HAS SCHEMA ISSUE!');
        console.log('The authProvider field type mismatch persists.');
        console.log('Emergency fix may not have run yet.');
      } else if (parsed.error && parsed.error.includes('Invalid')) {
        console.log('\n✅ Database schema appears fixed!');
        console.log('Error is now about invalid auth code (expected).');
      } else {
        console.log('\n🔍 Unexpected response - check manually');
      }
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();