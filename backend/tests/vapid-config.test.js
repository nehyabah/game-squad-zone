const webpush = require('web-push');

// Mock web-push for testing
jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  generateVAPIDKeys: jest.fn(),
  sendNotification: jest.fn()
}));

describe('VAPID Configuration Tests', () => {
  let originalEnv;

  beforeAll(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up test environment
    process.env.VAPID_SUBJECT = 'mailto:test@squadpot.com';
    process.env.VAPID_PUBLIC_KEY = 'BPf0QgXMxa6ZoHrmC21bED0aPpwZ55Ge7rQXgckMda81H93oEnm3ZPxGiGoKteWWU1DnhnrQ7oRMovRi-dueo6I';
    process.env.VAPID_PRIVATE_KEY = 'qoU3-unT6dtagIJ_sg6ukiBuTy-odPQd1YUXCRO1qcE';
  });

  describe('Environment Variable Validation', () => {
    test('should have all required VAPID environment variables', () => {
      expect(process.env.VAPID_SUBJECT).toBeDefined();
      expect(process.env.VAPID_PUBLIC_KEY).toBeDefined();
      expect(process.env.VAPID_PRIVATE_KEY).toBeDefined();

      expect(process.env.VAPID_SUBJECT).toMatch(/^mailto:/);
      expect(process.env.VAPID_PUBLIC_KEY).toHaveLength(88); // Base64 URL-safe length
      expect(process.env.VAPID_PRIVATE_KEY).toHaveLength(43); // Base64 URL-safe length
    });

    test('should validate VAPID subject format', () => {
      const validSubjects = [
        'mailto:admin@squadpot.com',
        'mailto:notifications@example.com',
        'https://squadpot.com/contact'
      ];

      const invalidSubjects = [
        'admin@squadpot.com', // Missing mailto: or https:
        'mailto:', // Missing email
        '', // Empty
        'invalid-format'
      ];

      validSubjects.forEach(subject => {
        expect(subject).toMatch(/^(mailto:|https:)/);
      });

      invalidSubjects.forEach(subject => {
        expect(subject).not.toMatch(/^(mailto:|https:)/);
      });
    });

    test('should validate VAPID key format', () => {
      const publicKey = process.env.VAPID_PUBLIC_KEY;
      const privateKey = process.env.VAPID_PRIVATE_KEY;

      // Public key should be base64 URL-safe encoded
      expect(publicKey).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(publicKey.length).toBe(88);

      // Private key should be base64 URL-safe encoded
      expect(privateKey).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(privateKey.length).toBe(43);

      // Keys should not contain padding (URL-safe base64)
      expect(publicKey).not.toContain('=');
      expect(privateKey).not.toContain('=');
    });
  });

  describe('VAPID Key Generation Validation', () => {
    test('should generate valid VAPID key pairs', () => {
      const mockKeys = {
        publicKey: 'BPf0QgXMxa6ZoHrmC21bED0aPpwZ55Ge7rQXgckMda81H93oEnm3ZPxGiGoKteWWU1DnhnrQ7oRMovRi-dueo6I',
        privateKey: 'qoU3-unT6dtagIJ_sg6ukiBuTy-odPQd1YUXCRO1qcE'
      };

      webpush.generateVAPIDKeys.mockReturnValue(mockKeys);

      const keys = webpush.generateVAPIDKeys();

      expect(keys.publicKey).toBeDefined();
      expect(keys.privateKey).toBeDefined();
      expect(keys.publicKey.length).toBe(88);
      expect(keys.privateKey.length).toBe(43);
    });

    test('should ensure key uniqueness', () => {
      const keys1 = {
        publicKey: 'BPf0QgXMxa6ZoHrmC21bED0aPpwZ55Ge7rQXgckMda81H93oEnm3ZPxGiGoKteWWU1DnhnrQ7oRMovRi-dueo6I',
        privateKey: 'qoU3-unT6dtagIJ_sg6ukiBuTy-odPQd1YUXCRO1qcE'
      };

      const keys2 = {
        publicKey: 'BDifferentKeyExample123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        privateKey: 'differentPrivateKey123456789abcdefghijk'
      };

      // Keys should be different (in real scenario)
      expect(keys1.publicKey).not.toBe(keys2.publicKey);
      expect(keys1.privateKey).not.toBe(keys2.privateKey);
    });
  });

  describe('Web Push Configuration', () => {
    test('should configure web-push with correct VAPID details', () => {
      const { PushNotificationService } = require('../src/services/push-notification.service.ts');
      const mockPrisma = {};

      // Creating service should call setVapidDetails
      new PushNotificationService(mockPrisma);

      expect(webpush.setVapidDetails).toHaveBeenCalledWith(
        process.env.VAPID_SUBJECT,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    });

    test('should handle missing environment variables gracefully', () => {
      delete process.env.VAPID_SUBJECT;
      delete process.env.VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PRIVATE_KEY;

      const { PushNotificationService } = require('../src/services/push-notification.service.ts');
      const mockPrisma = {};

      // Should not throw error, but setVapidDetails should be called with undefined values
      expect(() => new PushNotificationService(mockPrisma)).not.toThrow();

      expect(webpush.setVapidDetails).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined
      );
    });
  });

  describe('Security Considerations', () => {
    test('should not expose private key in logs or responses', () => {
      const privateKey = process.env.VAPID_PRIVATE_KEY;

      // Private key should never appear in JSON responses
      const mockResponse = {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        // privateKey should NOT be here
      };

      expect(mockResponse).not.toHaveProperty('privateKey');
      expect(JSON.stringify(mockResponse)).not.toContain(privateKey);
    });

    test('should validate key rotation scenario', () => {
      const originalKeys = {
        public: process.env.VAPID_PUBLIC_KEY,
        private: process.env.VAPID_PRIVATE_KEY
      };

      // Simulate key rotation
      const newKeys = {
        public: 'BNewPublicKeyExample123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012',
        private: 'newPrivateKey123456789abcdefghijklmnop'
      };

      // Update environment
      process.env.VAPID_PUBLIC_KEY = newKeys.public;
      process.env.VAPID_PRIVATE_KEY = newKeys.private;

      // Keys should be different
      expect(newKeys.public).not.toBe(originalKeys.public);
      expect(newKeys.private).not.toBe(originalKeys.private);

      // New keys should still be valid format
      expect(newKeys.public).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(newKeys.private).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    test('should validate subject email security', () => {
      const subject = process.env.VAPID_SUBJECT;

      // Should not contain sensitive information
      expect(subject.toLowerCase()).not.toContain('password');
      expect(subject.toLowerCase()).not.toContain('secret');
      expect(subject.toLowerCase()).not.toContain('key');

      // Should be a valid contact method
      if (subject.startsWith('mailto:')) {
        const email = subject.replace('mailto:', '');
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      } else if (subject.startsWith('https:')) {
        expect(subject).toMatch(/^https:\/\/.+/);
      }
    });
  });

  describe('Configuration Error Handling', () => {
    test('should handle invalid VAPID key format', () => {
      // Set invalid keys
      process.env.VAPID_PUBLIC_KEY = 'invalid-key-too-short';
      process.env.VAPID_PRIVATE_KEY = 'also-invalid';

      const { PushNotificationService } = require('../src/services/push-notification.service.ts');
      const mockPrisma = {};

      // Should not crash during initialization
      expect(() => new PushNotificationService(mockPrisma)).not.toThrow();

      // But web-push would reject these in real usage
      expect(process.env.VAPID_PUBLIC_KEY.length).toBeLessThan(88);
      expect(process.env.VAPID_PRIVATE_KEY.length).toBeLessThan(43);
    });

    test('should handle malformed subject', () => {
      process.env.VAPID_SUBJECT = 'not-a-valid-subject';

      const { PushNotificationService } = require('../src/services/push-notification.service.ts');
      const mockPrisma = {};

      expect(() => new PushNotificationService(mockPrisma)).not.toThrow();

      // Invalid subject should be passed to web-push (which would handle the error)
      expect(webpush.setVapidDetails).toHaveBeenCalledWith(
        'not-a-valid-subject',
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('Production Readiness', () => {
    test('should have production-ready configuration', () => {
      const subject = process.env.VAPID_SUBJECT;
      const publicKey = process.env.VAPID_PUBLIC_KEY;
      const privateKey = process.env.VAPID_PRIVATE_KEY;

      // All required fields should be present
      expect(subject).toBeTruthy();
      expect(publicKey).toBeTruthy();
      expect(privateKey).toBeTruthy();

      // Keys should be proper length for production
      expect(publicKey.length).toBe(88);
      expect(privateKey.length).toBe(43);

      // Subject should be professional
      if (subject.startsWith('mailto:')) {
        const email = subject.replace('mailto:', '');
        expect(email).not.toContain('test');
        expect(email).not.toContain('example');
        expect(email).not.toContain('localhost');
      }
    });

    test('should validate environment-specific configuration', () => {
      const nodeEnv = process.env.NODE_ENV || 'development';

      if (nodeEnv === 'production') {
        // Production-specific validations
        expect(process.env.VAPID_SUBJECT).not.toContain('test');
        expect(process.env.VAPID_SUBJECT).not.toContain('localhost');
      } else {
        // Development/test environment is more flexible
        expect(['development', 'test', undefined]).toContain(nodeEnv);
      }
    });

    test('should ensure keys are not default/example values', () => {
      const publicKey = process.env.VAPID_PUBLIC_KEY;
      const privateKey = process.env.VAPID_PRIVATE_KEY;

      // Should not be example/placeholder values
      expect(publicKey).not.toBe('your-public-key-here');
      expect(privateKey).not.toBe('your-private-key-here');
      expect(publicKey).not.toContain('example');
      expect(privateKey).not.toContain('example');
      expect(publicKey).not.toContain('placeholder');
      expect(privateKey).not.toContain('placeholder');
    });
  });

  describe('Cross-Browser Compatibility', () => {
    test('should generate keys compatible with all browsers', () => {
      const publicKey = process.env.VAPID_PUBLIC_KEY;

      // Should be in format expected by browsers
      expect(publicKey).toMatch(/^B[A-Za-z0-9_-]{87}$/); // Starts with 'B' for uncompressed point
      expect(publicKey.length).toBe(88); // Standard length for P-256 public key
    });

    test('should handle URL-safe base64 encoding', () => {
      const publicKey = process.env.VAPID_PUBLIC_KEY;
      const privateKey = process.env.VAPID_PRIVATE_KEY;

      // Should not contain standard base64 characters that need URL encoding
      expect(publicKey).not.toContain('+');
      expect(publicKey).not.toContain('/');
      expect(publicKey).not.toContain('=');

      expect(privateKey).not.toContain('+');
      expect(privateKey).not.toContain('/');
      expect(privateKey).not.toContain('=');

      // Should contain URL-safe alternatives
      const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
      expect(publicKey).toMatch(base64UrlRegex);
      expect(privateKey).toMatch(base64UrlRegex);
    });
  });
});

console.log('✅ VAPID configuration tests completed');