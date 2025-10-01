import React from "react";
import { ArrowLeft, Bell, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/use-push-notifications";

interface NotificationSettingsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NotificationSettings({
  open,
  onOpenChange,
}: NotificationSettingsProps) {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    status,
    subscribe,
    unsubscribe,
    sendTest,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <Bell className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-3">
          Notifications Unavailable
        </h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          Your browser doesn't support push notifications. Please use Safari,
          Chrome, or Firefox.
        </p>
      </div>
    );
  }

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center pt-2 pb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Bell className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Notifications</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Stay updated with pick deadlines, scores, and important announcements
        </p>
      </div>

      {/* Main Toggle Card */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isSubscribed
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-muted"
                }`}
              >
                {isSubscribed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-base">Push Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  {isSubscribed ? "Currently active" : "Currently disabled"}
                </p>
              </div>
            </div>
            <Switch
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={isLoading || permission === "denied"}
              className="data-[state=checked]:bg-green-500 disabled:opacity-50"
            />
          </div>

          {isSubscribed && (
            <div className="mt-6 pt-6 border-t border-border/50">
              <Button
                onClick={sendTest}
                disabled={isLoading}
                variant="outline"
                className="w-full h-11 rounded-xl font-medium"
              >
                Send Test Notification
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Notification Types */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold px-1">What You'll Receive</h2>

        <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50">
          <div className="p-5 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <span className="text-xl">🏈</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">Picks Open</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Friday at 5 AM Irish Time when picks open for the week
              </p>
            </div>
          </div>

          <div className="p-5 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <span className="text-xl">⏰</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">Pick Reminders</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reminders before Saturday noon deadline if you haven't picked
              </p>
            </div>
          </div>

          <div className="p-5 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <span className="text-xl">🏆</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">Score Updates</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When your picks are scored and results are available
              </p>
            </div>
          </div>

          <div className="p-5 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
              <span className="text-xl">📢</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">Announcements</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Important updates about features and schedule changes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {status && status.recentNotifications.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold px-1">Recent Activity</h2>

          <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50">
            {status.recentNotifications
              .slice(0, 5)
              .map((notification, index) => (
                <div key={index} className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {notification.type === "picks_open" && (
                      <span className="text-sm">🏈</span>
                    )}
                    {notification.type === "pick_reminder" && (
                      <span className="text-sm">⏰</span>
                    )}
                    {notification.type === "score_update" && (
                      <span className="text-sm">🏆</span>
                    )}
                    {notification.type === "window_event" && (
                      <span className="text-sm">ℹ️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.sentAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                  {notification.clicked && (
                    <Badge variant="secondary" className="text-xs h-5 shrink-0">
                      Opened
                    </Badge>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold px-1">Troubleshooting</h2>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 p-5">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="text-base">💡</span>
            Not receiving notifications?
          </h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0">
                •
              </span>
              <span>Check your browser's notification permissions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0">
                •
              </span>
              <span>Make sure SquadPot isn't blocked in system settings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0">
                •
              </span>
              <span>On mobile, add SquadPot to your home screen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0">
                •
              </span>
              <span>Try toggling notifications off and on again</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="bg-muted/50 rounded-xl p-4 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed">
          We respect your privacy. Notifications are only used to enhance your
          SquadPot experience. You can disable them at any time.
        </p>
      </div>
    </div>
  );

  // Sheet/Modal mode
  if (open !== undefined && onOpenChange) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg p-0 overflow-hidden z-[200]"
        >
          <SheetHeader className="px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 rounded-full"
                onClick={() => onOpenChange(false)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <SheetTitle className="text-lg font-semibold">
                Settings
              </SheetTitle>
            </div>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(100vh-73px)] px-6 py-6">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Standalone mode
  return <div className="max-w-2xl mx-auto px-4 py-8">{content}</div>;
}

export default NotificationSettings;
