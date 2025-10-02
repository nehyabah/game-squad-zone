import { useState, useEffect } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Already installed as PWA
    }

    // Android: Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroidPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS: Check if it's iOS Safari and not already installed
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;

    if (isIOS && !isInStandaloneMode) {
      // Show iOS prompt after a short delay
      setTimeout(() => {
        setShowIOSPrompt(true);
      }, 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ PWA installed');
    }

    setDeferredPrompt(null);
    setShowAndroidPrompt(false);
    handleDismiss();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowIOSPrompt(false);
    setShowAndroidPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (isDismissed) return null;

  // iOS Install Prompt
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-20 left-0 right-0 z-50 px-4 animate-slide-up">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-200 dark:border-orange-800 shadow-lg">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0 shadow-md">
                <span className="text-2xl">🏈</span>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm mb-1">Install SquadPot</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Add to your home screen for the best experience and notifications!
                </p>

                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-base">1️⃣</span>
                    <span>Tap the</span>
                    <Share className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold">Share</span>
                    <span>button below</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-base">2️⃣</span>
                    <span>Scroll and tap</span>
                    <Plus className="w-4 h-4" />
                    <span className="font-semibold">"Add to Home Screen"</span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-8 w-8 p-0"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Android Install Prompt
  if (showAndroidPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-0 right-0 z-50 px-4 animate-slide-up">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-200 dark:border-orange-800 shadow-lg">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0 shadow-md">
                <span className="text-2xl">🏈</span>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm mb-1">Install SquadPot App</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Install our app for quick access, offline support, and push notifications!
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={handleInstallAndroid}
                    size="sm"
                    className="flex-1 h-9 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Install
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="outline"
                    size="sm"
                    className="h-9"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-8 w-8 p-0"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}

export default PWAInstallPrompt;
