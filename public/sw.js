// SquadPot Service Worker for Push Notifications
// This handles push notifications when the app is in the background

const CACHE_NAME = 'squadpot-notifications-v1';

// Dynamically detect API URL based on environment
let API_BASE_URL;
if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
  API_BASE_URL = 'http://localhost:3001/api';
} else {
  // Production
  API_BASE_URL = 'https://squadpot-backend-production.up.railway.app/api';
}

// Install event - set up the service worker
self.addEventListener('install', function(event) {
  console.log('📱 SquadPot Service Worker installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('📱 SquadPot Service Worker activated');
  event.waitUntil(self.clients.claim()); // Take control immediately
});

// Push event - handle incoming push notifications
self.addEventListener('push', function(event) {
  console.log('🔔 Push notification received:', event.data);

  if (!event.data) {
    console.log('❌ Push event but no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.log('❌ Failed to parse push data:', error);
    return;
  }

  console.log('📋 Push notification data:', data);

  // Default notification options
  const options = {
    body: data.message || 'New notification from SquadPot',
    icon: '/icon-192.png', // Add this icon to public folder
    badge: '/badge-72.png', // Add this badge to public folder
    tag: data.type || 'squadpot-notification',
    requireInteraction: true, // Keep notification visible until user interacts
    data: {
      ...data,
      timestamp: Date.now(),
      url: getNotificationUrl(data.type, data.data)
    },
    actions: getNotificationActions(data.type)
  };

  // Customize based on notification type
  switch (data.type) {
    case 'picks_open':
      options.title = '🏈 Picks Are Open!';
      options.body = data.message || 'Time to make your picks! Get in before Saturday noon.';
      options.icon = '/pick-reminder-icon.png';
      break;

    case 'pick_reminder':
      options.title = '⏰ Pick Reminder';
      options.body = data.message || "Don't forget to make your picks! Deadline is Saturday at noon.";
      options.icon = '/pick-reminder-icon.png';
      break;

    case 'score_update':
      options.title = '🎯 Your Results Are In!';
      options.body = data.message || 'Your picks have been scored. Check your results!';
      options.icon = '/score-update-icon.png';
      break;

    case 'window_event':
      options.title = '👋 SquadPot';
      options.body = data.message || 'Welcome back to SquadPot!';
      options.icon = '/welcome-icon.png';
      break;

    default:
      options.title = data.title || '📱 SquadPot Notification';
  }

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', function(event) {
  console.log('🖱️ Notification clicked:', event.notification);

  const notification = event.notification;
  const data = notification.data;

  notification.close();

  // Handle action buttons
  if (event.action) {
    console.log('🔘 Action clicked:', event.action);

    switch (event.action) {
      case 'view_picks':
        event.waitUntil(openUrl('/picks'));
        break;
      case 'view_leaderboard':
        event.waitUntil(openUrl('/leaderboard'));
        break;
      case 'dismiss':
        // Just close the notification
        break;
      default:
        event.waitUntil(openUrl(data.url || '/'));
    }
  } else {
    // Default click action
    event.waitUntil(openUrl(data.url || '/'));
  }

  // Track notification click
  if (data && data.type && data.timestamp) {
    trackNotificationClick(data.type, data.timestamp);
  }
});

// Helper function to determine notification URL based on type
function getNotificationUrl(type, data) {
  switch (type) {
    case 'picks_open':
      return '/';
    case 'pick_reminder':
      return data && data.weekId ? `/picks?week=${data.weekId}` : '/picks';
    case 'score_update':
      return data && data.weekId ? `/leaderboard?week=${data.weekId}` : '/leaderboard';
    case 'window_event':
      return '/';
    default:
      return '/';
  }
}

// Helper function to get notification actions based on type
function getNotificationActions(type) {
  switch (type) {
    case 'picks_open':
      return [
        { action: 'view_picks', title: '🎯 Make Picks' },
        { action: 'dismiss', title: '❌ Dismiss' }
      ];
    case 'pick_reminder':
      return [
        { action: 'view_picks', title: '🎯 Make Picks' },
        { action: 'dismiss', title: '❌ Dismiss' }
      ];
    case 'score_update':
      return [
        { action: 'view_leaderboard', title: '📊 View Results' },
        { action: 'dismiss', title: '❌ Dismiss' }
      ];
    default:
      return [
        { action: 'view', title: '👀 View' },
        { action: 'dismiss', title: '❌ Dismiss' }
      ];
  }
}

// Helper function to open URL in client
async function openUrl(url) {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  });

  // If there's already a window open, focus it and navigate
  for (const client of clients) {
    if ('focus' in client) {
      await client.focus();
      if ('navigate' in client) {
        return client.navigate(url);
      } else {
        // Fallback: post message to client to navigate
        client.postMessage({
          type: 'NAVIGATE',
          url: url
        });
        return;
      }
    }
  }

  // If no window is open, open a new one
  if (clients.openWindow) {
    return clients.openWindow(url);
  }
}

// Helper function to track notification clicks for analytics
async function trackNotificationClick(type, timestamp) {
  try {
    // Get auth token from IndexedDB or localStorage (if available)
    const token = await getAuthToken();

    if (token) {
      await fetch(`${API_BASE_URL}/notifications/clicked`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: type,
          timestamp: timestamp
        })
      });
      console.log('📊 Notification click tracked');
    }
  } catch (error) {
    console.log('⚠️ Failed to track notification click:', error);
  }
}

// Helper function to get auth token (simplified - could be enhanced)
async function getAuthToken() {
  try {
    // Try to get from IndexedDB first (more reliable for service workers)
    const db = await openIndexedDB();
    const token = await getFromIndexedDB(db, 'auth', 'token');

    if (token) {
      return token;
    }

    // Fallback: try to get from clients
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      // Post message to client to get token
      client.postMessage({ type: 'GET_AUTH_TOKEN' });
    }
  } catch (error) {
    console.log('⚠️ Could not get auth token:', error);
  }
  return null;
}

// IndexedDB helpers for token storage
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('squadpot-storage', 1);

    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth');
      }
    };

    request.onsuccess = function(event) {
      resolve(event.target.result);
    };

    request.onerror = function(event) {
      reject(event.target.error);
    };
  });
}

function getFromIndexedDB(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = function(event) {
      resolve(event.target.result);
    };

    request.onerror = function(event) {
      reject(event.target.error);
    };
  });
}

// Background sync for offline notification handling (future enhancement)
self.addEventListener('sync', function(event) {
  if (event.tag === 'notification-sync') {
    console.log('🔄 Background sync for notifications');
    // Could be used to sync notification status when back online
  }
});

// Message handling from main thread
self.addEventListener('message', function(event) {
  console.log('💬 Message received in service worker:', event.data);

  if (event.data && event.data.type === 'AUTH_TOKEN_RESPONSE') {
    // Store auth token for future use
    storeAuthToken(event.data.token);
  }
});

async function storeAuthToken(token) {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['auth'], 'readwrite');
    const store = transaction.objectStore('auth');
    await store.put(token, 'token');
    console.log('💾 Auth token stored in IndexedDB');
  } catch (error) {
    console.log('⚠️ Failed to store auth token:', error);
  }
}

console.log('📱 SquadPot Service Worker loaded and ready for push notifications');