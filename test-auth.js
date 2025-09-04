// Test Auth Endpoint
const testAuth = async () => {
  try {
    console.log('Testing backend auth endpoint...');
    
    // Test the login endpoint
    const response = await fetch('http://localhost:3001/api/auth/login');
    
    if (!response.ok) {
      console.error('Auth endpoint failed:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response:', text);
    } else {
      const data = await response.json();
      console.log('Auth URL received:', data.authUrl);
      console.log('\nTo fix authentication:');
      console.log('1. Go to https://manage.auth0.com/');
      console.log('2. Navigate to your application (uBX39CJShJPMpgtLH9drNZkMaPsMVM7V)');
      console.log('3. Add these URLs:');
      console.log('   Allowed Callback URLs: http://localhost:3001/api/auth/callback');
      console.log('   Allowed Web Origins: http://localhost:8080, http://localhost:3001');
      console.log('   Allowed Logout URLs: http://localhost:8080');
    }
  } catch (error) {
    console.error('Error testing auth:', error);
  }
};

testAuth();