# Web Push Notifications Implementation Plan

## Overview
Implement mobile-friendly web push notifications for SquadPot to remind users about picks, notify about score updates, and track window events. Uses native browser push services (no Firebase/third-party required).

## Phase 1: Backend Foundation

### 1.1 Database Schema
```sql
-- Add to existing Prisma schema
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String   // Public key
  auth      String   // Auth secret
  userAgent String?  // Browser info
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  active    Boolean  @default(true)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("push_subscriptions")
}

model NotificationLog {
  id        String   @id @default(cuid())
  userId    String
  type      String   // "pick_reminder", "score_update", "window_event"
  title     String
  message   String
  sentAt    DateTime @default(now())
  clicked   Boolean  @default(false)
  clickedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notification_logs")
}

-- Update User model to include relations
// Add to User model:
// pushSubscriptions PushSubscription[]
// notificationLogs  NotificationLog[]
```

### 1.2 Install Dependencies
```bash
cd backend
npm install web-push
```

### 1.3 Generate VAPID Keys
```bash
# One-time setup - store these securely
npx web-push generate-vapid-keys
```

### 1.4 Environment Variables
```env
# Add to backend/.env
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@domain.com
```

### 1.5 Push Service Module
Create `backend/src/services/push-notification.service.ts`:
```typescript
import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

export class PushNotificationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
  }

  // Subscribe user to notifications
  async subscribe(userId: string, subscription: any) { ... }

  // Send notification to specific user
  async sendToUser(userId: string, payload: any) { ... }

  // Send notification to all users
  async sendToAll(payload: any) { ... }

  // Send pick reminders
  async sendPickReminders() { ... }

  // Send score updates
  async sendScoreUpdates(weekId: string) { ... }
}
```

### 1.6 API Routes
Create `backend/src/routes/notifications.ts`:
```typescript
// POST /api/notifications/subscribe
// DELETE /api/notifications/unsubscribe
// POST /api/notifications/test (admin only)
// GET /api/notifications/vapid-public-key
```

## Phase 2: Frontend Foundation

### 2.1 Service Worker
Create `public/sw.js`:
```javascript
// Handle push events
self.addEventListener('push', function(event) {
  const data = event.data.json();

  const options = {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.type,
    data: data,
    actions: [
      { action: 'view', title: 'View Picks' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/picks')
    );
  }
});
```

### 2.2 Push Manager Hook
Create `src/hooks/use-push-notifications.ts`:
```typescript
import { useState, useEffect } from 'react';
import { notificationAPI } from '@/lib/api/notifications';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check support
  useEffect(() => { ... });

  // Request permission and subscribe
  const subscribe = async () => { ... };

  // Unsubscribe
  const unsubscribe = async () => { ... };

  return { isSupported, isSubscribed, permission, subscribe, unsubscribe };
}
```

### 2.3 Notification API Client
Create `src/lib/api/notifications.ts`:
```typescript
export const notificationAPI = {
  getVapidPublicKey: () => api.get('/notifications/vapid-public-key'),
  subscribe: (subscription: any) => api.post('/notifications/subscribe', subscription),
  unsubscribe: () => api.delete('/notifications/unsubscribe'),
  testNotification: () => api.post('/notifications/test')
};
```

### 2.4 Permission Component
Create `src/components/NotificationPermission.tsx`:
```typescript
// Modal/banner to request notification permission
// Show after user makes first pick (not immediately)
// Include clear benefits: "Get reminded about picks"
```

## Phase 3: Core Features

### 3.1 Pick Reminders
**Trigger Logic:**
- Check daily at 8 AM, 2 PM, 8 PM (user's timezone)
- Only send if picks not submitted for current week
- Stop sending after deadline (Saturday noon)

**Integration Point:** `backend/src/utils/weekUtils.ts`

### 3.2 Score Updates
**Trigger Logic:**
- When auto-scoring completes in `auto-scoring.service.ts`
- Send summary: "Your Week 4 picks: 3 wins, 1 loss, 30 points"

**Integration Point:** `backend/src/services/auto-scoring.service.ts:76`

### 3.3 Window Event Tracking
**Frontend Events:**
- Window focus: "Welcome back! Check your leaderboard position"
- Window blur: Track engagement time
- App install prompt: "Add to home screen for faster access"

**Integration Point:** `src/components/Layout.tsx`

## Phase 4: Advanced Features

### 4.1 Admin Dashboard
- Send manual notifications
- View subscription statistics
- Test notification delivery

### 4.2 User Preferences
- Choose notification types (reminders, scores, announcements)
- Set quiet hours
- Frequency settings

### 4.3 Rich Notifications
- Custom icons per notification type
- Action buttons (View Picks, Check Scores)
- Deep linking to specific pages

## Implementation Steps

### Step 1: Database Setup
1. Add Prisma models for PushSubscription and NotificationLog
2. Run `npx prisma db push`
3. Generate VAPID keys and add to environment

### Step 2: Basic Backend
1. Install web-push package
2. Create PushNotificationService class
3. Add API routes for subscribe/unsubscribe
4. Add VAPID public key endpoint

### Step 3: Basic Frontend
1. Create service worker file
2. Register service worker in main.tsx
3. Create usePushNotifications hook
4. Add permission request component

### Step 4: Integration
1. Add pick reminder scheduler
2. Integrate with auto-scoring service
3. Add window event tracking
4. Test end-to-end flow

### Step 5: Polish
1. Add user preferences
2. Create admin dashboard
3. Improve notification design
4. Add analytics/logging

## Testing Strategy

### Development Testing
1. Use Chrome DevTools Application tab
2. Test on localhost with HTTPS (required for push)
3. Simulate different notification scenarios

### Production Testing
1. Test across browsers (Chrome, Firefox, Safari)
2. Test on mobile devices
3. Test permission flows
4. Verify notification delivery timing

## Security Considerations

1. **VAPID Keys**: Store securely, never expose private key
2. **Subscription Data**: Encrypt sensitive subscription endpoints
3. **Rate Limiting**: Prevent notification spam
4. **User Consent**: Clear opt-in/opt-out mechanisms
5. **Data Cleanup**: Remove inactive subscriptions

## Performance Considerations

1. **Batch Notifications**: Send to multiple users efficiently
2. **Retry Logic**: Handle failed deliveries gracefully
3. **Subscription Cleanup**: Remove invalid/expired subscriptions
4. **Database Indexing**: Index userId, createdAt for performance

## Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: iOS 16.4+, macOS 13+
- **Mobile**: Works in mobile browsers (not just PWAs)

## Rollout Plan

### Phase 1 (Week 1): MVP
- Basic subscription/unsubscription
- Simple pick reminders
- Manual testing

### Phase 2 (Week 2): Integration
- Auto-scoring notifications
- Window event tracking
- User preferences

### Phase 3 (Week 3): Polish
- Admin dashboard
- Rich notifications
- Production deployment

## Success Metrics

1. **Subscription Rate**: % of users who enable notifications
2. **Engagement**: Click-through rate on notifications
3. **Pick Completion**: Increase in on-time pick submissions
4. **Retention**: User return rate after notifications

---

## Quick Start Commands

```bash
# 1. Generate VAPID keys
npx web-push generate-vapid-keys

# 2. Add to environment
echo "VAPID_PUBLIC_KEY=your_key" >> backend/.env
echo "VAPID_PRIVATE_KEY=your_key" >> backend/.env
echo "VAPID_SUBJECT=mailto:you@domain.com" >> backend/.env

# 3. Install dependencies
cd backend && npm install web-push

# 4. Update database schema
npx prisma db push

# 5. Start implementation with backend service
```

This plan provides a complete roadmap from zero to production-ready push notifications integrated with your existing SquadPot functionality.