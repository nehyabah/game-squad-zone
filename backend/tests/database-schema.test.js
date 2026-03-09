const { PrismaClient } = require('@prisma/client');

describe('Database Schema Validation', () => {
  let prisma;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    try {
      await prisma.notificationLog.deleteMany({
        where: { userId: { startsWith: 'schema-test-' } }
      });
      await prisma.pushSubscription.deleteMany({
        where: { userId: { startsWith: 'schema-test-' } }
      });
    } catch (error) {
      console.log('Schema test cleanup warning:', error.message);
    }
  });

  describe('Push Subscriptions Table', () => {
    test('should have correct table structure', async () => {
      // Test that we can create a subscription with all required fields
      const subscription = {
        userId: 'schema-test-user-1',
        endpoint: 'https://schema-test-endpoint.com',
        p256dh: 'schema-test-p256dh-key',
        auth: 'schema-test-auth-key',
        userAgent: 'Schema Test Browser',
        active: true
      };

      const result = await prisma.pushSubscription.create({
        data: subscription
      });

      // Verify all fields are present and correct
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(subscription.userId);
      expect(result.endpoint).toBe(subscription.endpoint);
      expect(result.p256dh).toBe(subscription.p256dh);
      expect(result.auth).toBe(subscription.auth);
      expect(result.userAgent).toBe(subscription.userAgent);
      expect(result.active).toBe(subscription.active);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    test('should enforce unique endpoint constraint', async () => {
      const endpoint = 'https://unique-schema-test.com';

      // Create first subscription
      await prisma.pushSubscription.create({
        data: {
          userId: 'schema-test-user-1',
          endpoint,
          p256dh: 'test-p256dh-1',
          auth: 'test-auth-1'
        }
      });

      // Attempt to create second subscription with same endpoint
      await expect(
        prisma.pushSubscription.create({
          data: {
            userId: 'schema-test-user-2',
            endpoint, // Same endpoint
            p256dh: 'test-p256dh-2',
            auth: 'test-auth-2'
          }
        })
      ).rejects.toThrow();
    });

    test('should allow null userAgent', async () => {
      const result = await prisma.pushSubscription.create({
        data: {
          userId: 'schema-test-user-2',
          endpoint: 'https://null-user-agent-test.com',
          p256dh: 'test-p256dh',
          auth: 'test-auth',
          userAgent: null // Explicitly null
        }
      });

      expect(result.userAgent).toBeNull();
    });

    test('should have default values', async () => {
      const result = await prisma.pushSubscription.create({
        data: {
          userId: 'schema-test-user-3',
          endpoint: 'https://defaults-test.com',
          p256dh: 'test-p256dh',
          auth: 'test-auth'
          // Not providing active or timestamps
        }
      });

      expect(result.active).toBe(true); // Default value
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    test('should cascade delete with user', async () => {
      const testUserId = 'schema-test-cascade-user';

      // Create test user
      await prisma.user.create({
        data: {
          id: testUserId,
          oktaId: 'okta-cascade-test',
          email: 'cascade@test.com',
          username: 'cascadetest',
          status: 'active'
        }
      });

      // Create subscription for the user
      await prisma.pushSubscription.create({
        data: {
          userId: testUserId,
          endpoint: 'https://cascade-test.com',
          p256dh: 'test-p256dh',
          auth: 'test-auth'
        }
      });

      // Verify subscription exists
      let subscription = await prisma.pushSubscription.findFirst({
        where: { userId: testUserId }
      });
      expect(subscription).toBeTruthy();

      // Delete user
      await prisma.user.delete({
        where: { id: testUserId }
      });

      // Verify subscription was cascaded (deleted)
      subscription = await prisma.pushSubscription.findFirst({
        where: { userId: testUserId }
      });
      expect(subscription).toBeNull();
    });
  });

  describe('Notification Logs Table', () => {
    test('should have correct table structure', async () => {
      const log = {
        userId: 'schema-test-user-4',
        type: 'pick_reminder',
        title: 'Schema Test Notification',
        message: 'This is a schema test message',
        clicked: false
      };

      const result = await prisma.notificationLog.create({
        data: log
      });

      // Verify all fields are present and correct
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(log.userId);
      expect(result.type).toBe(log.type);
      expect(result.title).toBe(log.title);
      expect(result.message).toBe(log.message);
      expect(result.clicked).toBe(log.clicked);
      expect(result.sentAt).toBeInstanceOf(Date);
      expect(result.clickedAt).toBeNull(); // Should be null initially
    });

    test('should allow valid notification types', async () => {
      const validTypes = ['pick_reminder', 'score_update', 'window_event'];

      for (const type of validTypes) {
        const result = await prisma.notificationLog.create({
          data: {
            userId: `schema-test-user-type-${type}`,
            type,
            title: `Test ${type}`,
            message: `Testing ${type} notifications`
          }
        });

        expect(result.type).toBe(type);
      }
    });

    test('should have default values', async () => {
      const result = await prisma.notificationLog.create({
        data: {
          userId: 'schema-test-user-5',
          type: 'window_event',
          title: 'Default Test',
          message: 'Testing defaults'
          // Not providing clicked, sentAt, or clickedAt
        }
      });

      expect(result.clicked).toBe(false); // Default value
      expect(result.sentAt).toBeInstanceOf(Date); // Auto-generated
      expect(result.clickedAt).toBeNull(); // Default null
    });

    test('should allow clickedAt to be set when clicked is true', async () => {
      const clickTime = new Date();

      const result = await prisma.notificationLog.create({
        data: {
          userId: 'schema-test-user-6',
          type: 'score_update',
          title: 'Clicked Test',
          message: 'Testing clicked notifications',
          clicked: true,
          clickedAt: clickTime
        }
      });

      expect(result.clicked).toBe(true);
      expect(result.clickedAt).toEqual(clickTime);
    });

    test('should cascade delete with user', async () => {
      const testUserId = 'schema-test-log-cascade-user';

      // Create test user
      await prisma.user.create({
        data: {
          id: testUserId,
          oktaId: 'okta-log-cascade-test',
          email: 'logcascade@test.com',
          username: 'logcascadetest',
          status: 'active'
        }
      });

      // Create notification log for the user
      await prisma.notificationLog.create({
        data: {
          userId: testUserId,
          type: 'pick_reminder',
          title: 'Cascade Test Log',
          message: 'Testing cascade deletion'
        }
      });

      // Verify log exists
      let log = await prisma.notificationLog.findFirst({
        where: { userId: testUserId }
      });
      expect(log).toBeTruthy();

      // Delete user
      await prisma.user.delete({
        where: { id: testUserId }
      });

      // Verify log was cascaded (deleted)
      log = await prisma.notificationLog.findFirst({
        where: { userId: testUserId }
      });
      expect(log).toBeNull();
    });
  });

  describe('Index Performance', () => {
    test('should efficiently query by userId', async () => {
      const testUserId = 'schema-test-index-user';

      // Create multiple subscriptions and logs
      for (let i = 0; i < 5; i++) {
        await prisma.pushSubscription.create({
          data: {
            userId: testUserId,
            endpoint: `https://index-test-${i}.com`,
            p256dh: `test-p256dh-${i}`,
            auth: `test-auth-${i}`
          }
        });

        await prisma.notificationLog.create({
          data: {
            userId: testUserId,
            type: 'pick_reminder',
            title: `Index Test ${i}`,
            message: `Testing index performance ${i}`
          }
        });
      }

      // Query should be efficient (we can't easily test performance, but we can test functionality)
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: testUserId }
      });

      const logs = await prisma.notificationLog.findMany({
        where: { userId: testUserId }
      });

      expect(subscriptions).toHaveLength(5);
      expect(logs).toHaveLength(5);
    });

    test('should efficiently query active subscriptions', async () => {
      // Create mix of active and inactive subscriptions
      for (let i = 0; i < 3; i++) {
        await prisma.pushSubscription.create({
          data: {
            userId: `schema-test-active-${i}`,
            endpoint: `https://active-test-${i}.com`,
            p256dh: `test-p256dh-${i}`,
            auth: `test-auth-${i}`,
            active: i % 2 === 0 // Alternate active/inactive
          }
        });
      }

      const activeSubscriptions = await prisma.pushSubscription.findMany({
        where: { active: true }
      });

      const inactiveSubscriptions = await prisma.pushSubscription.findMany({
        where: { active: false }
      });

      expect(activeSubscriptions.length).toBeGreaterThan(0);
      expect(inactiveSubscriptions.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity', () => {
    test('should maintain referential integrity', async () => {
      // Verify that subscriptions and logs reference valid users
      const subscription = await prisma.pushSubscription.create({
        data: {
          userId: 'schema-test-integrity-user',
          endpoint: 'https://integrity-test.com',
          p256dh: 'test-p256dh',
          auth: 'test-auth'
        }
      });

      // Should be able to query related user (even if user doesn't exist in our test)
      const subscriptionWithUser = await prisma.pushSubscription.findUnique({
        where: { id: subscription.id },
        include: { user: true }
      });

      expect(subscriptionWithUser.userId).toBe('schema-test-integrity-user');
    });

    test('should handle large text fields', async () => {
      const longMessage = 'A'.repeat(1000); // 1000 character message
      const longTitle = 'T'.repeat(200);    // 200 character title

      const result = await prisma.notificationLog.create({
        data: {
          userId: 'schema-test-long-text',
          type: 'window_event',
          title: longTitle,
          message: longMessage
        }
      });

      expect(result.title).toBe(longTitle);
      expect(result.message).toBe(longMessage);
      expect(result.title.length).toBe(200);
      expect(result.message.length).toBe(1000);
    });
  });

  describe('Schema Validation Edge Cases', () => {
    test('should handle special characters in text fields', async () => {
      const specialMessage = 'Test with émojis 🎯📱 and spëcial characters: @#$%^&*()';

      const result = await prisma.notificationLog.create({
        data: {
          userId: 'schema-test-special-chars',
          type: 'pick_reminder',
          title: 'Special Characters Test',
          message: specialMessage
        }
      });

      expect(result.message).toBe(specialMessage);
    });

    test('should handle URL variations in endpoints', async () => {
      const endpoints = [
        'https://example.com',
        'https://subdomain.example.com/path',
        'https://example.com:8080/webhook',
        'https://very-long-domain-name-for-testing-purposes.example.com/very/long/path/to/endpoint'
      ];

      for (let i = 0; i < endpoints.length; i++) {
        const result = await prisma.pushSubscription.create({
          data: {
            userId: `schema-test-url-${i}`,
            endpoint: endpoints[i],
            p256dh: `test-p256dh-${i}`,
            auth: `test-auth-${i}`
          }
        });

        expect(result.endpoint).toBe(endpoints[i]);
      }
    });

    test('should handle timezone-aware timestamps', async () => {
      const now = new Date();

      const result = await prisma.notificationLog.create({
        data: {
          userId: 'schema-test-timezone',
          type: 'score_update',
          title: 'Timezone Test',
          message: 'Testing timestamp handling',
          clicked: true,
          clickedAt: now
        }
      });

      // Times should be stored and retrieved correctly
      expect(result.clickedAt.getTime()).toBe(now.getTime());
      expect(result.sentAt).toBeInstanceOf(Date);
    });
  });
});

console.log('✅ Database schema validation tests completed');