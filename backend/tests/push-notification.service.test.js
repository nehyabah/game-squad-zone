const { PrismaClient } = require('@prisma/client');
const { PushNotificationService } = require('../src/services/push-notification.service.ts');

// Mock web-push
jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({}),
}));

describe('PushNotificationService', () => {
  let prisma;
  let pushService;

  beforeAll(async () => {
    // Set up test environment variables
    process.env.VAPID_SUBJECT = 'mailto:test@squadpot.com';
    process.env.VAPID_PUBLIC_KEY = 'BPf0QgXMxa6ZoHrmC21bED0aPpwZ55Ge7rQXgckMda81H93oEnm3ZPxGiGoKteWWU1DnhnrQ7oRMovRi-dueo6I';
    process.env.VAPID_PRIVATE_KEY = 'qoU3-unT6dtagIJ_sg6ukiBuTy-odPQd1YUXCRO1qcE';

    // Initialize Prisma client
    prisma = new PrismaClient();
    pushService = new PushNotificationService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
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

  describe('Database Schema Tests', () => {
    test('should create push_subscriptions table correctly', async () => {
      const testSubscription = {
        id: 'test-sub-1',
        userId: 'test-user-1',
        endpoint: 'https://test-endpoint-1.com',
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key',
        userAgent: 'Test Browser',
        active: true
      };

      const result = await prisma.pushSubscription.create({
        data: testSubscription
      });

      expect(result.id).toBe(testSubscription.id);
      expect(result.userId).toBe(testSubscription.userId);
      expect(result.endpoint).toBe(testSubscription.endpoint);
      expect(result.active).toBe(true);
    });

    test('should create notification_logs table correctly', async () => {
      const testLog = {
        id: 'test-log-1',
        userId: 'test-user-1',
        type: 'pick_reminder',
        title: 'Test Notification',
        message: 'This is a test message',
        clicked: false
      };

      const result = await prisma.notificationLog.create({
        data: testLog
      });

      expect(result.id).toBe(testLog.id);
      expect(result.type).toBe(testLog.type);
      expect(result.title).toBe(testLog.title);
      expect(result.clicked).toBe(false);
    });

    test('should enforce unique endpoint constraint', async () => {
      const subscription1 = {
        id: 'test-sub-1',
        userId: 'test-user-1',
        endpoint: 'https://unique-endpoint.com',
        p256dh: 'test-p256dh-1',
        auth: 'test-auth-1'
      };

      const subscription2 = {
        id: 'test-sub-2',
        userId: 'test-user-2',
        endpoint: 'https://unique-endpoint.com', // Same endpoint
        p256dh: 'test-p256dh-2',
        auth: 'test-auth-2'
      };

      await prisma.pushSubscription.create({ data: subscription1 });

      await expect(
        prisma.pushSubscription.create({ data: subscription2 })
      ).rejects.toThrow();
    });
  });

  describe('Service Methods', () => {
    test('should subscribe user successfully', async () => {
      const userId = 'test-user-subscribe';
      const subscription = {
        endpoint: 'https://test-subscribe-endpoint.com',
        keys: {
          p256dh: 'test-p256dh-subscribe',
          auth: 'test-auth-subscribe'
        }
      };

      await pushService.subscribe(userId, subscription, 'Test Browser');

      const savedSubscription = await prisma.pushSubscription.findFirst({
        where: { userId }
      });

      expect(savedSubscription).toBeTruthy();
      expect(savedSubscription.endpoint).toBe(subscription.endpoint);
      expect(savedSubscription.p256dh).toBe(subscription.keys.p256dh);
      expect(savedSubscription.auth).toBe(subscription.keys.auth);
      expect(savedSubscription.active).toBe(true);
    });

    test('should unsubscribe user successfully', async () => {
      const userId = 'test-user-unsubscribe';

      // First create a subscription
      await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: 'https://test-unsubscribe-endpoint.com',
          p256dh: 'test-p256dh',
          auth: 'test-auth',
          active: true
        }
      });

      await pushService.unsubscribe(userId);

      const subscription = await prisma.pushSubscription.findFirst({
        where: { userId }
      });

      expect(subscription.active).toBe(false);
    });

    test('should handle subscription upsert correctly', async () => {
      const userId = 'test-user-upsert';
      const endpoint = 'https://test-upsert-endpoint.com';

      const subscription1 = {
        endpoint,
        keys: {
          p256dh: 'old-p256dh',
          auth: 'old-auth'
        }
      };

      const subscription2 = {
        endpoint,
        keys: {
          p256dh: 'new-p256dh',
          auth: 'new-auth'
        }
      };

      // First subscription
      await pushService.subscribe(userId, subscription1);
      let savedSub = await prisma.pushSubscription.findFirst({ where: { endpoint } });
      expect(savedSub.p256dh).toBe('old-p256dh');

      // Update with same endpoint (should upsert)
      await pushService.subscribe(userId, subscription2);
      savedSub = await prisma.pushSubscription.findFirst({ where: { endpoint } });
      expect(savedSub.p256dh).toBe('new-p256dh');

      // Should only have one subscription with this endpoint
      const count = await prisma.pushSubscription.count({ where: { endpoint } });
      expect(count).toBe(1);
    });
  });

  describe('Notification Logging', () => {
    test('should log notifications correctly', async () => {
      const userId = 'test-user-logging';

      // Create a subscription first
      await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: 'https://test-logging-endpoint.com',
          p256dh: 'test-p256dh',
          auth: 'test-auth',
          active: true
        }
      });

      const payload = {
        title: 'Test Notification',
        message: 'This is a test message',
        type: 'pick_reminder'
      };

      await pushService.sendToUser(userId, payload);

      const log = await prisma.notificationLog.findFirst({
        where: { userId, type: 'pick_reminder' }
      });

      expect(log).toBeTruthy();
      expect(log.title).toBe(payload.title);
      expect(log.message).toBe(payload.message);
      expect(log.type).toBe(payload.type);
      expect(log.clicked).toBe(false);
    });
  });

  describe('Cleanup Operations', () => {
    test('should clean up inactive subscriptions', async () => {
      const now = new Date();
      const thirtyOneDaysAgo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

      // Create old inactive subscription
      await prisma.pushSubscription.create({
        data: {
          userId: 'test-user-cleanup',
          endpoint: 'https://old-endpoint.com',
          p256dh: 'test-p256dh',
          auth: 'test-auth',
          active: false,
          updatedAt: thirtyOneDaysAgo
        }
      });

      // Create recent active subscription
      await prisma.pushSubscription.create({
        data: {
          userId: 'test-user-active',
          endpoint: 'https://active-endpoint.com',
          p256dh: 'test-p256dh',
          auth: 'test-auth',
          active: true
        }
      });

      await pushService.cleanupInactiveSubscriptions();

      const oldSub = await prisma.pushSubscription.findFirst({
        where: { endpoint: 'https://old-endpoint.com' }
      });
      const activeSub = await prisma.pushSubscription.findFirst({
        where: { endpoint: 'https://active-endpoint.com' }
      });

      expect(oldSub).toBeNull(); // Should be deleted
      expect(activeSub).toBeTruthy(); // Should remain
    });
  });

  describe('Error Handling', () => {
    test('should handle missing subscription data gracefully', async () => {
      const userId = 'test-user-no-subscription';

      const payload = {
        title: 'Test Notification',
        message: 'This should not be sent',
        type: 'pick_reminder'
      };

      // Should not throw error when user has no subscriptions
      await expect(
        pushService.sendToUser(userId, payload)
      ).resolves.not.toThrow();

      // Should not create notification log if no subscriptions
      const log = await prisma.notificationLog.findFirst({
        where: { userId }
      });
      expect(log).toBeNull();
    });

    test('should handle invalid subscription data', async () => {
      const userId = 'test-user-invalid';
      const invalidSubscription = {
        endpoint: 'invalid-endpoint',
        keys: {
          p256dh: '',
          auth: ''
        }
      };

      await expect(
        pushService.subscribe(userId, invalidSubscription)
      ).rejects.toThrow();
    });
  });
});

console.log('✅ PushNotificationService tests completed');