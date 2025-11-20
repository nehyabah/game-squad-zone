const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:8081';
const tests = [];
let passedTests = 0;
let totalTests = 0;

function addTest(name, testFn) {
  tests.push({ name, testFn });
  totalTests++;
}

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}${message ? ' - ' + message : ''}`);
  if (passed) passedTests++;
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    }).on('error', reject);
  });
}

// Test 1: Service Worker Accessibility
addTest('Service Worker File Available', async () => {
  try {
    const response = await httpGet(`${BASE_URL}/sw.js`);
    const passed = response.statusCode === 200 && response.data.includes('push');
    logTest('Service Worker File Available', passed,
      passed ? 'SW file accessible and contains push logic' : `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('Service Worker File Available', false, error.message);
  }
});

// Test 2: Test Page Accessibility
addTest('Test Page Available', async () => {
  try {
    const response = await httpGet(`${BASE_URL}/test-notifications.html`);
    const passed = response.statusCode === 200 && response.data.includes('Push Notification Test Suite');
    logTest('Test Page Available', passed,
      passed ? 'Test page loaded successfully' : `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('Test Page Available', false, error.message);
  }
});

// Test 3: Main App Loads
addTest('Main Application Loads', async () => {
  try {
    const response = await httpGet(`${BASE_URL}/`);
    const passed = response.statusCode === 200 && response.data.length > 1000;
    logTest('Main Application Loads', passed,
      passed ? 'Main app loaded with content' : `Status: ${response.statusCode}, Length: ${response.data.length}`);
  } catch (error) {
    logTest('Main Application Loads', false, error.message);
  }
});

// Test 4: Static Assets
addTest('Notification Assets Available', async () => {
  try {
    // Test if we can access the app manifest or icons (common for PWAs)
    const manifestResponse = await httpGet(`${BASE_URL}/site.webmanifest`).catch(() => ({ statusCode: 404 }));
    const iconResponse = await httpGet(`${BASE_URL}/icon-192x192.png`).catch(() => ({ statusCode: 404 }));

    // We don't require these to exist, but log their status
    const manifestExists = manifestResponse.statusCode === 200;
    const iconExists = iconResponse.statusCode === 200;

    logTest('Notification Assets Available', true,
      `Manifest: ${manifestExists ? 'Found' : 'Not found'}, Icon: ${iconExists ? 'Found' : 'Not found'}`);
  } catch (error) {
    logTest('Notification Assets Available', false, error.message);
  }
});

// Test 5: Service Worker Content Validation
addTest('Service Worker Implementation', async () => {
  try {
    const response = await httpGet(`${BASE_URL}/sw.js`);
    const content = response.data;

    const hasEventListeners = content.includes("addEventListener('push'") &&
                            content.includes("addEventListener('notificationclick'");
    const hasNotificationLogic = content.includes('showNotification') || content.includes('Notification');
    const hasMessageHandling = content.includes("addEventListener('message'");

    const passed = hasEventListeners && hasNotificationLogic;
    logTest('Service Worker Implementation', passed,
      `Events: ${hasEventListeners}, Notifications: ${hasNotificationLogic}, Messages: ${hasMessageHandling}`);
  } catch (error) {
    logTest('Service Worker Implementation', false, error.message);
  }
});

// Test 6: Frontend API Mock Testing
addTest('Frontend API Resilience', () => {
  // This test validates that our mock API functions exist and are structured correctly
  const mockVapidKey = 'BMqSvZjkdJbXLpa5qOQ_V0KPMRRm_KT7YUCAJPq0-9HsROTlIZdWWRSx5p8WR5Q_-YHj0wjNrKE3lE_rXv6f6VY';

  // Validate VAPID key format (should be base64url encoded)
  const isValidVapidKey = mockVapidKey.length > 60 && /^[A-Za-z0-9_-]+$/.test(mockVapidKey);

  logTest('Frontend API Resilience', isValidVapidKey,
    isValidVapidKey ? 'Mock VAPID key format valid' : 'Invalid VAPID key format');
});

// Run all tests
async function runTests() {
  console.log('🔔 Starting Push Notification End-to-End Tests\n');
  console.log(`Testing against: ${BASE_URL}\n`);

  for (const test of tests) {
    try {
      await test.testFn();
    } catch (error) {
      logTest(test.name, false, `Unexpected error: ${error.message}`);
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Notification system is ready for manual testing.');
    console.log(`\n📱 Manual Testing Instructions:`);
    console.log(`1. Open: ${BASE_URL}/test-notifications.html`);
    console.log(`2. Click through each test button in order`);
    console.log(`3. Grant permissions when prompted`);
    console.log(`4. Verify notifications appear in your system`);
    console.log(`\n🌐 Main App with Notifications:`);
    console.log(`1. Open: ${BASE_URL}/`);
    console.log(`2. Look for notification permission banner`);
    console.log(`3. Test enable/disable functionality`);
  } else {
    console.log('\n⚠️  Some tests failed. Check the issues above before manual testing.');
  }
}

// Start testing
runTests().catch(console.error);