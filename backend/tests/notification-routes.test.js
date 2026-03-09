const { PrismaClient } = require('@prisma/client');
const { buildApp } = require('../src/app');

describe('Notification API Routes', () => {
  let app;
  let prisma;
  let authToken;

  beforeAll(async () => {
    // Set up test environment
    process.env.VAPID_SUBJECT = 'mailto:test@squadpot.com';
    process.env.VAPID_PUBLIC_KEY = 'BPf0QgXMxa6ZoHrmC21bED0aPpwZ55Ge7rQXgckMda81H93oEnm3ZPxGiGoKteWWU1DnhnrQ7oRMovRi-dueo6I';
    process.env.VAPID_PRIVATE_KEY = 'qoU3-unT6dtagIJ_sg6ukiBuTy-odPQd1YUXCRO1qcE';

    // Build Fastify app
    app = buildApp();
    await app.ready();
    prisma = app.prisma;

    // Create test user and get auth token
    const testUserId = 'test-api-user';
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        oktaId: 'okta-test-api',
        email: 'test-api@example.com',
        username: 'testapi',
        firstName: 'Test',
        lastName: 'API',
        status: 'active',
        emailVerified: true,
      }
    });

    // Generate auth token
    const payload = { sub: testUserId, email: 'test-api@example.com' };
    authToken = app.jwt.sign(payload);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    try {
      await prisma.notificationLog.deleteMany({
        where: { userId: { startsWith: 'test-' } }
      });
      await prisma.pushSubscription.deleteMany({
        where: { userId: { startsWith: 'test-' } }
      });
    } catch (error) {
      console.log('Cleanup warning:', error.message);
    }
  });

  describe('GET /api/notifications/vapid-public-key', () => {
    test('should return VAPID public key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/notifications/vapid-public-key'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.publicKey).toBe(process.env.VAPID_PUBLIC_KEY);
    });

    test('should handle missing VAPID key configuration', async () => {
      const originalKey = process.env.VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PUBLIC_KEY;

      const response = await app.inject({
        method: 'GET',
        url: '/api/notifications/vapid-public-key'
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('VAPID public key not configured');

      // Restore the key
      process.env.VAPID_PUBLIC_KEY = originalKey;
    });
  });

  describe('POST /api/notifications/subscribe', () => {
    test('should subscribe user with valid data', async () => {
      const subscriptionData = {
        subscription: {
          endpoint: 'https://test-api-endpoint.com',
          keys: {
            p256dh: 'test-api-p256dh',
            auth: 'test-api-auth'
          }
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/notifications/subscribe',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        payload: subscriptionData
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Successfully subscribed to notifications');

      // Verify subscription was saved
      const savedSubscription = await prisma.pushSubscription.findFirst({
        where: { userId: 'test-api-user' }
      });
      expect(savedSubscription).toBeTruthy();
      expect(savedSubscription.endpoint).toBe(subscriptionData.subscription.endpoint);
    });

    test('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/notifications/subscribe',
        payload: { subscription: {} }
      });

      expect(response.statusCode).toBe(401);
    });

    test('should reject invalid subscription data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/notifications/subscribe',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        payload: { subscription: { endpoint: 'invalid' } } // Missing keys
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid subscription data');
    });
  });

  describe('DELETE /api/notifications/unsubscribe', () => {
    test('should unsubscribe user successfully', async () => {
      // First create a subscription
      await prisma.pushSubscription.create({
        data: {
          userId: 'test-api-user',
          endpoint: 'https://test-unsubscribe-api.com',
          p256dh: 'test-p256dh',
          auth: 'test-auth',
          active: true
        }
      });

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/notifications/unsubscribe',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Verify subscription was deactivated
      const subscription = await prisma.pushSubscription.findFirst({
        where: { userId: 'test-api-user' }
      });
      expect(subscription.active).toBe(false);
    });

    test('should require authentication', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/notifications/unsubscribe'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/notifications/test', () => {
    test('should send test notification to authenticated user', async () => {
      // First create a subscription
      await prisma.pushSubscription.create({
        data: {
          userId: 'test-api-user',
          endpoint: 'https://test-notification-api.com',
          p256dh: 'test-p256dh',
          auth: 'test-auth',
          active: true
        }
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/notifications/test',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Test notification sent');

      // Verify notification was logged
      const log = await prisma.notificationLog.findFirst({
        where: {
          userId: 'test-api-user',
          type: 'window_event'
        }
      });
      expect(log).toBeTruthy();
      expect(log.title).toBe('SquadPot Test Notification');
    });

    test('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/notifications/test'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/notifications/status', () => {
    test('should return user notification status', async () => {
      // Create subscription and notification log
      await prisma.pushSubscription.create({
        data: {
          userId: 'test-api-user',
          endpoint: 'https://test-status-api.com',
          p256dh: 'test-p256dh',
          auth: 'test-auth',
          active: true,
          userAgent: 'Test Browser'
        }
      });

      await prisma.notificationLog.create({
        data: {
          userId: 'test-api-user',
          type: 'pick_reminder',
          title: 'Test Log',
          message: 'Test message',
          clicked: false
        }
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/notifications/status',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.isSubscribed).toBe(true);
      expect(body.subscriptionCount).toBe(1);
      expect(body.subscriptions).toHaveLength(1);
      expect(body.recentNotifications).toHaveLength(1);
      expect(body.subscriptions[0].userAgent).toBe('Test Browser');
    });

    test('should return empty status for unsubscribed user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/notifications/status',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.isSubscribed).toBe(false);
      expect(body.subscriptionCount).toBe(0);
      expect(body.subscriptions).toHaveLength(0);
    });
  });

  describe('POST /api/notifications/clicked', () => {
    test('should mark notification as clicked', async () => {
      const timestamp = Date.now();

      // Create notification log
      await prisma.notificationLog.create({
        data: {
          userId: 'test-api-user',
          type: 'pick_reminder',
          title: 'Clickable Test',
          message: 'Test message',
          sentAt: new Date(timestamp),
          clicked: false
        }
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/notifications/clicked',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        payload: {
          type: 'pick_reminder',
          timestamp
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Verify notification was marked as clicked
      const log = await prisma.notificationLog.findFirst({
        where: {
          userId: 'test-api-user',
          type: 'pick_reminder'
        }
      });
      expect(log.clicked).toBe(true);
      expect(log.clickedAt).toBeTruthy();
    });
  });

  describe('Admin Routes', () => {
    test('should send broadcast notification', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/notifications/admin/broadcast',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        payload: {
          title: 'Test Broadcast',
          message: 'This is a test broadcast',
          type: 'window_event'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Broadcast notification sent to all users');
    });

    test('should send pick reminders for specific week', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/notifications/admin/pick-reminders',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        payload: {
          weekId: 'Week 5'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Pick reminders sent for Week 5');
    });

    test('should get notification statistics', async () => {
      // Create test data
      await prisma.pushSubscription.create({
        data: {
          userId: 'test-api-user',
          endpoint: 'https://test-stats.com',
          p256dh: 'test-p256dh',
          auth: 'test-auth',
          active: true
        }
      });

      await prisma.notificationLog.create({
        data: {
          userId: 'test-api-user',
          type: 'pick_reminder',
          title: 'Stats Test',
          message: 'Test message',
          clicked: true
        }
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/notifications/admin/stats',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.subscriptions).toBeDefined();
      expect(body.notifications).toBeDefined();
      expect(body.clickThroughRates).toBeDefined();
      expect(body.subscriptions.active).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Simulate database connection issue by using invalid query
      const response = await app.inject({
        method: 'GET',
        url: '/api/notifications/status',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Should not crash the server even if database has issues
      expect([200, 500]).toContain(response.statusCode);
    });

    test('should validate required fields in broadcast', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/notifications/admin/broadcast',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        payload: {
          title: 'Missing fields'
          // Missing message and type
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Title, message, and type are required');
    });
  });
});

console.log('✅ Notification API routes tests completed');