import React, { useState, useEffect } from 'react';
import { X, Bell, BellOff, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/use-push-notifications';

interface NotificationPermissionBannerProps {
  onDismiss?: () => void;
  showTestButton?: boolean;
  variant?: 'banner' | 'card' | 'inline';
}

export function NotificationPermissionBanner({
  onDismiss,
  showTestButton = true,
  variant = 'banner'
}: NotificationPermissionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    status,
    subscribe,
    unsubscribe,
    sendTest,
    requestPermission
  } = usePushNotifications();

  // Check if banner was previously dismissed
  useEffect(() => {
    const bannerDismissed = localStorage.getItem('notification-banner-dismissed');
    const notificationInteracted = localStorage.getItem('notification-interacted');

    // Hide banner if:
    // 1. User manually dismissed it
    // 2. User has already interacted with notifications (granted or denied)
    // 3. Notifications are already subscribed
    if (bannerDismissed === 'true' || notificationInteracted === 'true' || isSubscribed) {
      setIsDismissed(true);
    }
  }, [isSubscribed]);

  // Auto-dismiss after successful subscription
  useEffect(() => {
    if (isSubscribed) {
      localStorage.setItem('notification-interacted', 'true');
      setIsDismissed(true);
    }
  }, [isSubscribed]);

  const handleDismiss = () => {
    localStorage.setItem('notification-banner-dismissed', 'true');
    setIsDismissed(true);
    onDismiss?.();
  };

  const handlePermissionAction = async (action: () => Promise<void>) => {
    // Mark that user has interacted with notifications
    localStorage.setItem('notification-interacted', 'true');
    await action();
  };

  if (!isSupported || isDismissed) {
    return null;
  }

  // Don't show banner if user has already denied permission
  if (permission === 'denied') {
    return null;
  }

  const getStatusInfo = () => {
    if (isSubscribed) {
      return {
        icon: <Bell className="w-5 h-5 text-green-600" />,
        title: 'Notifications Enabled',
        description: 'You\'ll receive pick reminders and score updates',
        actionText: 'Disable',
        actionVariant: 'outline' as const,
        action: unsubscribe,
        badgeVariant: 'default' as const,
        badgeText: 'Active'
      };
    }

    if (permission === 'denied') {
      return {
        icon: <BellOff className="w-5 h-5 text-red-600" />,
        title: 'Notifications Blocked',
        description: 'Enable in browser settings to receive reminders',
        actionText: 'Try Again',
        actionVariant: 'outline' as const,
        action: requestPermission,
        badgeVariant: 'destructive' as const,
        badgeText: 'Blocked'
      };
    }

    return {
      icon: <Bell className="w-5 h-5 text-blue-600" />,
      title: 'Enable Notifications',
      description: 'Get reminders when it\'s time to make your picks',
      actionText: 'Enable',
      actionVariant: 'default' as const,
      action: subscribe,
      badgeVariant: 'secondary' as const,
      badgeText: 'Available'
    };
  };

  const statusInfo = getStatusInfo();

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b border-blue-200 dark:border-blue-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {statusInfo.icon}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {statusInfo.title}
                  </h3>
                  <Badge variant={statusInfo.badgeVariant} className="text-xs">
                    {statusInfo.badgeText}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {statusInfo.description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {showTestButton && isSubscribed && (
                <Button
                  onClick={sendTest}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <TestTube className="w-4 h-4" />
                  <span>Test</span>
                </Button>
              )}

              <Button
                onClick={() => handlePermissionAction(statusInfo.action)}
                disabled={isLoading}
                variant={statusInfo.actionVariant}
                size="sm"
              >
                {isLoading ? 'Loading...' : statusInfo.actionText}
              </Button>

              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {statusInfo.icon}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-sm font-medium">
                    {statusInfo.title}
                  </h3>
                  <Badge variant={statusInfo.badgeVariant} className="text-xs">
                    {statusInfo.badgeText}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {statusInfo.description}
                </p>

                {status && isSubscribed && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {status.subscriptionCount} device{status.subscriptionCount !== 1 ? 's' : ''} subscribed
                    {status.recentNotifications.length > 0 && (
                      <span className="ml-2">
                        • Last notification: {new Date(status.recentNotifications[0].sentAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {showTestButton && isSubscribed && (
                <Button
                  onClick={sendTest}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <TestTube className="w-4 h-4 mr-1" />
                  Test
                </Button>
              )}

              <Button
                onClick={() => handlePermissionAction(statusInfo.action)}
                disabled={isLoading}
                variant={statusInfo.actionVariant}
                size="sm"
              >
                {isLoading ? 'Loading...' : statusInfo.actionText}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Inline variant
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center space-x-3">
        {statusInfo.icon}
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{statusInfo.title}</span>
            <Badge variant={statusInfo.badgeVariant} className="text-xs">
              {statusInfo.badgeText}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {statusInfo.description}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {showTestButton && isSubscribed && (
          <Button
            onClick={sendTest}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <TestTube className="w-4 h-4" />
          </Button>
        )}

        <Button
          onClick={statusInfo.action}
          disabled={isLoading}
          variant={statusInfo.actionVariant}
          size="sm"
        >
          {isLoading ? '...' : statusInfo.actionText}
        </Button>
      </div>
    </div>
  );
}

export default NotificationPermissionBanner;