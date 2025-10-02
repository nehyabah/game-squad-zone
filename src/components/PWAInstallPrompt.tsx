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
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptType, setPromptType] = useState<'ios' | 'android' | null>(null);

  useEffect(() => {
    console.log('🔍 PWA Install Prompt: Initializing...');

    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed === 'true') {
      console.log('❌ PWA Install Prompt: Previously dismissed');
      return;
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('✅ PWA Install Prompt: Already installed as PWA');
      return;
    }

    // Android: Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('📱 PWA Install Prompt: Android beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPromptType('android');
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS: Check if it's iOS Safari and not already installed
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;

    console.log('🔍 PWA Install Prompt: isIOS =', isIOS, ', isInStandaloneMode =', isInStandaloneMode);

    if (isIOS && !isInStandaloneMode) {
      console.log('🍎 PWA Install Prompt: Showing iOS prompt in 2 seconds...');
      setTimeout(() => {
        setPromptType('ios');
        setShowPrompt(true);
        console.log('🍎 PWA Install Prompt: iOS prompt displayed');
      }, 2000);
    } else if (!isIOS) {
      // TEMPORARY: For testing on desktop, show iOS-style prompt
      console.log('💻 PWA Install Prompt: Desktop - showing test prompt in 2 seconds...');
      setTimeout(() => {
        setPromptType('ios');
        setShowPrompt(true);
        console.log('💻 PWA Install Prompt: Test prompt displayed');
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
    handleDismiss();
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 animate-slide-up">
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-orange-200 dark:border-orange-800/50 shadow-xl">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <img
              src="/android/android-launchericon-192-192.png"
              alt="SquadPot"
              className="w-14 h-14 rounded-2xl shrink-0 shadow-lg"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-base">Install SquadPot</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-7 w-7 p-0 -mr-2"
                  onClick={handleDismiss}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Get notifications, quick access, and offline support
              </p>

              {promptType === 'android' && deferredPrompt ? (
                <div className="flex gap-2">
                  <Button
                    onClick={handleInstallAndroid}
                    size="sm"
                    className="flex-1 h-9 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-md"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Install App
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    size="sm"
                    className="h-9 text-muted-foreground"
                  >
                    Later
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">1</span>
                    </div>
                    <span className="text-muted-foreground">Tap</span>
                    <Share className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium">Share</span>
                    <span className="text-muted-foreground">below</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">2</span>
                    </div>
                    <span className="text-muted-foreground">Select</span>
                    <Plus className="w-3.5 h-3.5" />
                    <span className="font-medium">Add to Home Screen</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default PWAInstallPrompt;
