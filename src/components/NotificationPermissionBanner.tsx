import React, { useState, useEffect } from "react";
import { X, Bell, BellOff, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/use-push-notifications";

interface NotificationPermissionBannerProps {
  onDismiss?: () => void;
  showTestButton?: boolean;
  variant?: "banner" | "card" | "inline";
}

export function NotificationPermissionBanner({
  onDismiss,
  showTestButton = true,
  variant = "banner",
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
    requestPermission,
  } = usePushNotifications();

  useEffect(() => {
    try {
      const bannerDismissed = localStorage.getItem(
        "notification-banner-dismissed"
      );

      if (bannerDismissed === "true") {
        setIsDismissed(true);
      }
    } catch (error) {
      // Ignore localStorage errors (tracking prevention)
      console.log("Cannot access localStorage:", error);
    }
  }, []);

  // Permanently dismiss banner when user subscribes
  useEffect(() => {
    if (isSubscribed) {
      try {
        localStorage.setItem("notification-banner-dismissed", "true");
        setIsDismissed(true);
      } catch (error) {
        console.log("Cannot set localStorage:", error);
      }
    }
  }, [isSubscribed]);

  const handleDismiss = () => {
    try {
      localStorage.setItem("notification-banner-dismissed", "true");
    } catch (error) {
      // Ignore localStorage errors
      console.log("Cannot set localStorage:", error);
    }
    setIsDismissed(true);
    onDismiss?.();
  };

  const handlePermissionAction = async (action: () => Promise<void>) => {
    await action();

    // If user enabled notifications, dismiss banner permanently
    if (action === subscribe) {
      handleDismiss();
    }
  };

  if (!isSupported || isDismissed || permission === "denied") {
    return null;
  }

  const getStatusInfo = () => {
    if (isSubscribed) {
      return {
        icon: <Bell className="w-4 h-4 text-green-600" />,
        title: "Notifications On",
        description: "Get pick reminders",
        actionText: "Disable",
        actionVariant: "outline" as const,
        action: unsubscribe,
        badgeVariant: "default" as const,
        badgeText: "Active",
      };
    }

    return {
      icon: <Bell className="w-4 h-4 text-blue-600" />,
      title: "Enable Notifications",
      description: "Get reminders for picks",
      actionText: "Enable",
      actionVariant: "default" as const,
      action: subscribe,
      badgeVariant: "secondary" as const,
      badgeText: "Off",
    };
  };

  const statusInfo = getStatusInfo();

  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-blue-100 dark:border-blue-900/30">
        <div className="px-2 py-1.5 sm:px-3 sm:py-2.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Icon & Content */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center shrink-0">
                <div className="scale-75 sm:scale-100">
                  {statusInfo.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <h3 className="text-[10px] sm:text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {statusInfo.title}
                  </h3>
                  <Badge
                    variant={statusInfo.badgeVariant}
                    className="text-[8px] sm:text-[10px] h-3 sm:h-4 px-1 sm:px-1.5"
                  >
                    {statusInfo.badgeText}
                  </Badge>
                </div>
                <p className="text-[8px] sm:text-[10px] text-gray-600 dark:text-gray-400 truncate hidden sm:block">
                  {statusInfo.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              {showTestButton && isSubscribed && (
                <Button
                  onClick={sendTest}
                  disabled={isLoading}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                >
                  <TestTube className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </Button>
              )}

              <Button
                onClick={() => handlePermissionAction(statusInfo.action)}
                disabled={isLoading}
                variant={statusInfo.actionVariant}
                size="sm"
                className="h-6 px-2 sm:h-7 sm:px-2.5 text-[10px] sm:text-xs font-medium"
              >
                {isLoading ? "..." : statusInfo.actionText}
              </Button>

              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <Card className="w-full border-border/50">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold">{statusInfo.title}</h3>
                <Badge
                  variant={statusInfo.badgeVariant}
                  className="text-xs h-5"
                >
                  {statusInfo.badgeText}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {statusInfo.description}
              </p>

              {status &&
                isSubscribed &&
                status.recentNotifications.length > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    Last:{" "}
                    {new Date(
                      status.recentNotifications[0].sentAt
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}

              <div className="flex items-center gap-2 mt-3">
                <Button
                  onClick={() => handlePermissionAction(statusInfo.action)}
                  disabled={isLoading}
                  variant={statusInfo.actionVariant}
                  size="sm"
                  className="h-8 flex-1 text-xs font-medium"
                >
                  {isLoading ? "Loading..." : statusInfo.actionText}
                </Button>

                {showTestButton && isSubscribed && (
                  <Button
                    onClick={sendTest}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                  >
                    <TestTube className="w-3.5 h-3.5 mr-1" />
                    Test
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Inline variant
  return (
    <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-xl border border-border/50">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0">
          {statusInfo.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold truncate">
              {statusInfo.title}
            </span>
            <Badge
              variant={statusInfo.badgeVariant}
              className="text-[10px] h-4"
            >
              {statusInfo.badgeText}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            {statusInfo.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2">
        {showTestButton && isSubscribed && (
          <Button
            onClick={sendTest}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
          >
            <TestTube className="w-3.5 h-3.5" />
          </Button>
        )}

        <Button
          onClick={() => handlePermissionAction(statusInfo.action)}
          disabled={isLoading}
          variant={statusInfo.actionVariant}
          size="sm"
          className="h-7 px-2.5 text-xs"
        >
          {isLoading ? "..." : statusInfo.actionText}
        </Button>
      </div>
    </div>
  );
}

export default NotificationPermissionBanner;
