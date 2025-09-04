// Test Manual Login Endpoint
async function testManualLogin() {
  try {
    console.log('Testing manual login endpoint...\n');
    
    // Test login with email (creates user if doesn't exist)
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'any-password' // Not checked in test mode
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Login successful!');
    console.log('\nAccess Token:', data.accessToken.substring(0, 50) + '...');
    console.log('\nUser Info:');
    console.log('- ID:', data.user.id);
    console.log('- Email:', data.user.email);
    console.log('- Username:', data.user.username);
    console.log('- Status:', data.user.status);
    
    console.log('\n📝 To use this in your app:');
    console.log('1. Store the accessToken in localStorage');
    console.log('2. Include it in the Authorization header for API calls');
    console.log('3. Example: Authorization: Bearer ' + data.accessToken.substring(0, 20) + '...');
    
    // Test authenticated request
    console.log('\n🔐 Testing authenticated request to /api/squads...');
    const squadsResponse = await fetch('http://localhost:3001/api/squads', {
      headers: {
        'Authorization': `Bearer ${data.accessToken}`
      }
    });
    
    if (squadsResponse.ok) {
      const squads = await squadsResponse.json();
      console.log('✅ Authenticated request successful! Squads:', squads);
    } else {
      console.log('❌ Squads request failed:', squadsResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Login failed:', error.message);
  }
}

testManualLogin();