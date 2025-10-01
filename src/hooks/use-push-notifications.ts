import { useState, useEffect, useCallback } from "react";
import {
  notificationAPI,
  isPushNotificationSupported,
  hasNotificationPermission,
  requestNotificationPermission,
  getNotificationPermission,
  convertPushSubscription,
  type NotificationStatus,
} from "@/lib/api/notifications";
import { toast } from "@/hooks/use-toast";

interface UsePushNotificationsReturn {
  // Status
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
  status: NotificationStatus | null;

  // Actions
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  sendTest: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;

  // Service Worker
  isServiceWorkerReady: boolean;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<NotificationStatus | null>(null);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  // Initialize and check support
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const supported = isPushNotificationSupported();
        setIsSupported(supported);
        setPermission(getNotificationPermission());

        if (supported) {
          await initializeServiceWorker();
          await refreshStatus();
        }
      } catch (error) {
        console.error("❌ Failed to initialize notifications:", error);
        toast({
          title: "Notification Setup Error",
          description: "Could not initialize push notifications.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeNotifications();
  }, []);

  // Initialize service worker
  const initializeServiceWorker =
    async (): Promise<ServiceWorkerRegistration | null> => {
      try {
        if (!("serviceWorker" in navigator)) {
          throw new Error("Service workers not supported");
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("📱 Service worker registered:", registration);

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        setIsServiceWorkerReady(true);

        // Handle messages from service worker
        navigator.serviceWorker.addEventListener(
          "message",
          handleServiceWorkerMessage
        );

        return registration;
      } catch (error) {
        console.error("❌ Service worker registration failed:", error);
        throw error;
      }
    };

  // Handle messages from service worker
  const handleServiceWorkerMessage = (event: MessageEvent) => {
    console.log("💬 Message from service worker:", event.data);

    if (event.data?.type === "GET_AUTH_TOKEN") {
      // Service worker is requesting auth token
      const token = localStorage.getItem("auth_token"); // Adjust based on your auth storage
      if (token && event.source) {
        (event.source as ServiceWorker).postMessage({
          type: "AUTH_TOKEN_RESPONSE",
          token: token,
        });
      }
    } else if (event.data?.type === "NAVIGATE") {
      // Service worker wants to navigate to a URL
      window.location.href = event.data.url;
    }
  };

  // Get current notification status
  const refreshStatus = useCallback(async () => {
    try {
      const currentStatus = await notificationAPI.getStatus();
      setStatus(currentStatus);
      setIsSubscribed(currentStatus.isSubscribed);
    } catch (error) {
      console.error("❌ Failed to get notification status:", error);
      // Don't show error toast for status check failures
    }
  }, []);

  // Request notification permission
  const requestPermissionAction =
    useCallback(async (): Promise<NotificationPermission> => {
      try {
        const newPermission = await requestNotificationPermission();
        setPermission(newPermission);

        if (newPermission === "granted") {
          toast({
            title: "Notifications Enabled! 🎉",
            description:
              "You'll now receive reminders and updates from SquadPot.",
          });
        } else if (newPermission === "denied") {
          toast({
            title: "Notifications Blocked",
            description:
              "You can enable notifications in your browser settings if you change your mind.",
            variant: "destructive",
          });
        }

        return newPermission;
      } catch (error) {
        console.error("❌ Permission request failed:", error);
        toast({
          title: "Permission Error",
          description: "Could not request notification permission.",
          variant: "destructive",
        });
        return "denied";
      }
    }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Check permission
      if (permission !== "granted") {
        const newPermission = await requestPermissionAction();
        if (newPermission !== "granted") {
          return;
        }
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        throw new Error("Service worker not ready");
      }

      // Get VAPID public key
      const { publicKey } = await notificationAPI.getVapidPublicKey();

      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      console.log("📱 Push subscription created:", pushSubscription);

      // Send subscription to server
      const subscription = convertPushSubscription(pushSubscription);
      await notificationAPI.subscribe(subscription);

      // Update status
      await refreshStatus();

      toast({
        title: "Notifications Enabled! 🔔",
        description: "You'll receive pick reminders and score updates.",
      });
    } catch (error) {
      console.error("❌ Subscription failed:", error);
      toast({
        title: "Subscription Failed",
        description: "Could not enable notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermissionAction, refreshStatus]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    try {
      setIsLoading(true);

      // Unsubscribe from server
      await notificationAPI.unsubscribe();

      // Unsubscribe from browser
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();

      if (pushSubscription) {
        await pushSubscription.unsubscribe();
        console.log("📱 Push subscription removed");
      }

      // Update status
      await refreshStatus();

      toast({
        title: "Notifications Disabled",
        description: "You will no longer receive push notifications.",
      });
    } catch (error) {
      console.error("❌ Unsubscribe failed:", error);
      toast({
        title: "Unsubscribe Failed",
        description: "Could not disable notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus]);

  // Send test notification
  const sendTest = useCallback(async () => {
    if (!isSubscribed) {
      toast({
        title: "Not Subscribed",
        description: "Please enable notifications first to send a test.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await notificationAPI.sendTestNotification();

      toast({
        title: "Test Sent! 🚀",
        description: "Check for the test notification.",
      });
    } catch (error) {
      console.error("❌ Test notification failed:", error);
      toast({
        title: "Test Failed",
        description: "Could not send test notification.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isSubscribed]);

  return {
    // Status
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    status,

    // Actions
    subscribe,
    unsubscribe,
    sendTest,
    refreshStatus,
    requestPermission: requestPermissionAction,

    // Service Worker
    isServiceWorkerReady,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
