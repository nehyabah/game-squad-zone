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

  const [localChecked, setLocalChecked] = React.useState(isSubscribed);

  // Sync local state with hook state
  React.useEffect(() => {
    setLocalChecked(isSubscribed);
  }, [isSubscribed]);

  // Check if running as PWA
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;

  // Show PWA install prompt if not supported and not in PWA mode
  const showPWAPrompt = !isSupported && !isPWA;

  const handleToggle = async (checked: boolean) => {
    // Optimistic UI update
    setLocalChecked(checked);

    try {
      if (checked) {
        await subscribe();
      } else {
        await unsubscribe();
      }
    } catch (error) {
      // Revert on error
      setLocalChecked(!checked);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Hero Section - Reduced */}
      <div className="text-center pt-1 pb-3">
        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Bell className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold mb-1">Notifications</h1>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Stay updated with pick deadlines and scores
        </p>
      </div>

      {/* Main Toggle Card */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="p-4">
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
              checked={localChecked}
              onCheckedChange={handleToggle}
              disabled={false}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold px-1">What You'll Receive</h2>

        <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/50">
          <div className="p-3 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <span className="text-base">🏈</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-xs mb-0.5">Picks Open</h4>
              <p className="text-xs text-muted-foreground">
                Friday 5 AM when picks open
              </p>
            </div>
          </div>

          <div className="p-3 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <span className="text-base">⏰</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-xs mb-0.5">Pick Reminders</h4>
              <p className="text-xs text-muted-foreground">
                Before Saturday noon deadline
              </p>
            </div>
          </div>

          <div className="p-3 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <span className="text-base">🏆</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-xs mb-0.5">Score Updates</h4>
              <p className="text-xs text-muted-foreground">
                When results are available
              </p>
            </div>
          </div>

          <div className="p-3 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
              <span className="text-base">📢</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-xs mb-0.5">Announcements</h4>
              <p className="text-xs text-muted-foreground">
                Important updates
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold px-1">Troubleshooting</h2>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 p-3">
          <h4 className="font-semibold text-xs mb-2 flex items-center gap-2">
            <span className="text-sm">💡</span>
            Not receiving notifications?
          </h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 dark:text-blue-400 shrink-0">•</span>
              <span>Check browser notification permissions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 dark:text-blue-400 shrink-0">•</span>
              <span>On iPhone: Install as PWA from home screen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 dark:text-blue-400 shrink-0">•</span>
              <span>Toggle notifications off and on</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="bg-muted/50 rounded-lg p-2.5 text-center">
        <p className="text-xs text-muted-foreground">
          You can disable notifications at any time
        </p>
      </div>
    </div>
  );

  // Sheet/Modal mode
  if (open !== undefined && onOpenChange) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[85vh] sm:h-[90vh] rounded-t-2xl border-0 p-0 bg-background z-[200]"
        >
          <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
          <div className="overflow-y-auto h-[calc(100%-53px)] px-4 py-4">
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
