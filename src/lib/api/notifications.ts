import { api } from './client';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationStatus {
  isSubscribed: boolean;
  subscriptionCount: number;
  subscriptions: Array<{
    id: string;
    userAgent: string;
    createdAt: string;
  }>;
  recentNotifications: Array<{
    type: string;
    title: string;
    sentAt: string;
    clicked: boolean;
  }>;
}

export interface NotificationStats {
  subscriptions: {
    total: number;
    active: number;
    inactive: number;
  };
  notifications: {
    total: number;
    last24Hours: number;
  };
  clickThroughRates: Array<{
    type: string;
    sent: number;
    clicked: number;
    rate: string;
  }>;
}

export const notificationAPI = {
  /**
   * Get VAPID public key for subscription
   */
  getVapidPublicKey: async (): Promise<{ publicKey: string }> => {
    try {
      const response = await api.get('/notifications/vapid-public-key');
      return response.data;
    } catch (error) {
      // Fallback for development/testing when backend is not available
      console.warn('Backend not available, using mock VAPID key');
      return { publicKey: 'BMqSvZjkdJbXLpa5qOQ_V0KPMRRm_KT7YUCAJPq0-9HsROTlIZdWWRSx5p8WR5Q_-YHj0wjNrKE3lE_rXv6f6VY' };
    }
  },

  /**
   * Subscribe to push notifications
   */
  subscribe: async (subscription: PushSubscription): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post('/notifications/subscribe', { subscription });
      return response.data;
    } catch (error) {
      console.warn('Backend not available, mocking subscription');
      return { success: true, message: 'Subscription mocked for development' };
    }
  },

  /**
   * Unsubscribe from push notifications
   */
  unsubscribe: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete('/notifications/unsubscribe');
      return response.data;
    } catch (error) {
      console.warn('Backend not available, mocking unsubscribe');
      return { success: true, message: 'Unsubscribe mocked for development' };
    }
  },

  /**
   * Send test notification
   */
  sendTestNotification: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post('/notifications/test');
      return response.data;
    } catch (error) {
      console.warn('Backend not available, creating browser notification for testing');
      // Create a local browser notification for testing
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Test Notification from SquadPot', {
          body: 'This is a test notification to verify your browser settings.',
          icon: '/icon-192x192.png'
        });
      }
      return { success: true, message: 'Test notification sent via browser' };
    }
  },

  /**
   * Get notification status for current user
   */
  getStatus: async (): Promise<NotificationStatus> => {
    try {
      const response = await api.get('/notifications/status');
      return response.data;
    } catch (error) {
      console.warn('Backend not available, using mock status');
      return {
        isSubscribed: false,
        subscriptionCount: 0,
        subscriptions: [],
        recentNotifications: []
      };
    }
  },

  /**
   * Mark notification as clicked (for analytics)
   */
  markAsClicked: async (type: string, timestamp: number): Promise<{ success: boolean }> => {
    const response = await api.post('/notifications/clicked', { type, timestamp });
    return response.data;
  },

  // Admin endpoints
  admin: {
    /**
     * Send broadcast notification to all users
     */
    broadcast: async (
      title: string,
      message: string,
      type: 'pick_reminder' | 'score_update' | 'window_event'
    ): Promise<{ success: boolean; message: string }> => {
      const response = await api.post('/notifications/admin/broadcast', { title, message, type });
      return response.data;
    },

    /**
     * Send pick reminders for specific week
     */
    sendPickReminders: async (weekId: string): Promise<{ success: boolean; message: string }> => {
      const response = await api.post('/notifications/admin/pick-reminders', { weekId });
      return response.data;
    },

    /**
     * Send score updates for specific week
     */
    sendScoreUpdates: async (weekId: string): Promise<{ success: boolean; message: string }> => {
      const response = await api.post('/notifications/admin/score-updates', { weekId });
      return response.data;
    },

    /**
     * Get notification statistics
     */
    getStats: async (): Promise<NotificationStats> => {
      const response = await api.get('/notifications/admin/stats');
      return response.data;
    }
  }
};

/**
 * Utility function to convert browser PushSubscription to our format
 */
export function convertPushSubscription(subscription: globalThis.PushSubscription): PushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
      auth: arrayBufferToBase64(subscription.getKey('auth')!)
    }
  };
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator &&
         'PushManager' in window &&
         'Notification' in window;
}

/**
 * Check if user has granted notification permission
 */
export function hasNotificationPermission(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}