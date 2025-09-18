import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useSquads } from "@/hooks/use-squads";
import { toast } from "@/hooks/use-toast";
import LoginPage from "@/components/LoginPage";
import ProfileSetup from "@/components/ProfileSetup";
import Header from "@/components/Header";
import SquadManagerWithConditionalTabs from "@/components/SquadManagerWithConditionalTabs";
import GameSelection from "@/components/GameSelection";
import MyPicks from "@/components/MyPicks";
import TeamLogosBanner from "@/components/TeamLogosBanner";
import AuthModal from "@/components/AuthModal";
import AccountMenu from "@/components/AccountMenu";
import CountdownTimer from "@/components/CountdownTimer";
import Wallet from "@/components/Wallet";
import WalletPaymentHandler from "@/components/WalletPaymentHandler";
import Leaderboard from "@/components/Leaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet as WalletIcon, UserPlus, Loader2 } from "lucide-react";
import { getDisplayName } from "@/lib/utils/user";

const Index = () => {
  const [activeTab, setActiveTab] = useState("fixtures");
  const [squadSubTab, setSquadSubTab] = useState("chat");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);
  const [joiningSquad, setJoiningSquad] = useState(false);
  const { user, loading, profileSetupRequired } = useAuth();
  const { joinSquad } = useSquads();

  // Handle squad joining from URL parameter
  useEffect(() => {
    const handleUrlJoinCode = () => {
      if (!user || loading) return;

      const urlParams = new URLSearchParams(window.location.search);
      const joinCode = urlParams.get('joinCode');
      
      if (joinCode) {
        // Store the join code and show confirmation modal
        setPendingJoinCode(joinCode.toUpperCase());
        setShowJoinModal(true);
        
        // Clean up URL parameter immediately
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleUrlJoinCode();
  }, [user, loading]);

  // Add global error handler for browser extension issues
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // Suppress browser extension errors
      if (event.filename?.includes('web-client-content-script.js') || 
          event.filename?.includes('extension') ||
          event.message?.includes('MutationObserver')) {
        event.preventDefault();
        console.warn('Suppressed browser extension error:', event.message);
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Log but don't crash on unhandled promise rejections
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Handle confirmed squad joining
  const handleConfirmJoin = async () => {
    if (!pendingJoinCode) return;
    
    setJoiningSquad(true);
    
    try {
      const squad = await joinSquad({ joinCode: pendingJoinCode });
      
      if (squad) {
        toast({
          title: "Welcome to the squad! 🎉",
          description: `You've successfully joined "${squad.name}". Check out the Squads tab to start chatting!`,
          duration: 5000,
        });
        
        // Switch to squads tab to show the newly joined squad
        setActiveTab("create");
        setShowJoinModal(false);
        setPendingJoinCode(null);
      }
    } catch (error: any) {
      console.error('Failed to join squad:', error);
      toast({
        title: "Couldn't join squad",
        description: error.message || "The join code may be invalid or expired.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setJoiningSquad(false);
    }
  };

  // Handle join modal cancellation
  const handleCancelJoin = () => {
    setShowJoinModal(false);
    setPendingJoinCode(null);
  };


  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading SquadPot...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }
  
  // Show profile setup if required
  if (profileSetupRequired) {
    return <ProfileSetup />;
  }
  
  // Show main app if authenticated and profile is complete
  return (
    <div className="min-h-screen bg-background">
      <Header onAuthClick={() => setShowAuthModal(true)} />
      <WalletPaymentHandler />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-8">
        {/* Welcome Message and Team Logos Banner - Only on Fixtures tab */}
        {activeTab === "fixtures" && (
          <>
            <div className="text-center mb-4 sm:mb-8">
              <h2 className="text-xl sm:text-3xl font-display font-bold text-foreground mb-1 sm:mb-2">
                Welcome back, {getDisplayName(user)}! 👋
              </h2>
              <p className="text-muted-foreground text-xs sm:text-base">
                Ready to make your picks?
              </p>
            </div>

            {/* Team Logos Banner */}
            <TeamLogosBanner />
          </>
        )}

        {activeTab !== "create" && activeTab !== "wallet" && <CountdownTimer />}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Tabs */}
          <TabsList className="hidden sm:grid w-full grid-cols-5 max-w-4xl mx-auto mb-16 h-12 bg-primary/10 backdrop-blur-md border border-primary/20 rounded-xl p-1 shadow-lg">
            <TabsTrigger
              value="fixtures"
              className="font-medium text-sm px-2 py-2 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:backdrop-blur-sm data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-200 text-primary/60 hover:text-primary/80"
            >
              Fixtures
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="font-medium text-sm px-2 py-2 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:backdrop-blur-sm data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-200 text-primary/60 hover:text-primary/80"
            >
              Squads
            </TabsTrigger>
            <TabsTrigger
              value="games"
              className="font-medium text-sm px-2 py-2 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:backdrop-blur-sm data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-200 text-primary/60 hover:text-primary/80"
            >
              My Picks
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="font-medium text-sm px-2 py-2 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:backdrop-blur-sm data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-200 text-primary/60 hover:text-primary/80"
            >
              Leaderboard
            </TabsTrigger>
            <TabsTrigger
              value="wallet"
              className="font-medium text-sm px-2 py-2 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:backdrop-blur-sm data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-200 text-primary/60 hover:text-primary/80"
            >
              Wallet
            </TabsTrigger>
          </TabsList>

          {/* Mobile Bottom Tabs - iOS Style with Glass Effect */}
          <div className="fixed bottom-0 left-0 right-0 z-[100] sm:hidden">
            {/* Glass morphism background with layered effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/95 to-white/80 dark:from-gray-900/95 dark:to-gray-800/80 backdrop-blur-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/40 dark:via-gray-700/20 dark:to-gray-600/40"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-gray-400/60"></div>

            <div className="relative grid grid-cols-5 h-20 safe-area-pb">
              <button
                onClick={() => setActiveTab("fixtures")}
                className="flex flex-col items-center justify-center py-2 group transition-all duration-300"
              >
                <div className="flex flex-col items-center space-y-1">
                  <div
                    className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      activeTab === "fixtures"
                        ? "bg-white/30 dark:bg-white/20 shadow-lg backdrop-blur-sm border border-white/40 dark:border-white/30 scale-110"
                        : "bg-white/10 dark:bg-white/5 group-hover:bg-white/20 dark:group-hover:bg-white/10 group-hover:scale-105 backdrop-blur-sm"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 flex items-center justify-center transition-colors duration-300 ${
                        activeTab === "fixtures"
                          ? "text-primary"
                          : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                      }`}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>

                    {/* Glass shine effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
                  </div>
                  <span
                    className={`text-xs font-medium transition-all duration-300 ${
                      activeTab === "fixtures"
                        ? "text-primary font-semibold"
                        : "text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300"
                    }`}
                  >
                    Fixtures
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("create")}
                className="flex flex-col items-center justify-center py-2 group transition-all duration-300"
              >
                <div className="flex flex-col items-center space-y-1">
                  <div
                    className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      activeTab === "create"
                        ? "bg-white/30 dark:bg-white/20 shadow-lg backdrop-blur-sm border border-white/40 dark:border-white/30 scale-110"
                        : "bg-white/10 dark:bg-white/5 group-hover:bg-white/20 dark:group-hover:bg-white/10 group-hover:scale-105 backdrop-blur-sm"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 flex items-center justify-center transition-colors duration-300 ${
                        activeTab === "create"
                          ? "text-primary"
                          : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                      }`}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>

                    {/* Glass shine effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
                  </div>
                  <span
                    className={`text-xs font-medium transition-all duration-300 ${
                      activeTab === "create"
                        ? "text-primary font-semibold"
                        : "text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300"
                    }`}
                  >
                    Squads
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("games")}
                className="flex flex-col items-center justify-center py-2 group transition-all duration-300"
              >
                <div className="flex flex-col items-center space-y-1">
                  <div
                    className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      activeTab === "games"
                        ? "bg-white/30 dark:bg-white/20 shadow-lg backdrop-blur-sm border border-white/40 dark:border-white/30 scale-110"
                        : "bg-white/10 dark:bg-white/5 group-hover:bg-white/20 dark:group-hover:bg-white/10 group-hover:scale-105 backdrop-blur-sm"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 flex items-center justify-center transition-colors duration-300 ${
                        activeTab === "games"
                          ? "text-primary"
                          : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                      }`}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    </div>

                    {/* Glass shine effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
                  </div>
                  <span
                    className={`text-xs font-medium transition-all duration-300 ${
                      activeTab === "games"
                        ? "text-primary font-semibold"
                        : "text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300"
                    }`}
                  >
                    My Picks
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("wallet")}
                className="flex flex-col items-center justify-center py-2 group transition-all duration-300"
              >
                <div className="flex flex-col items-center space-y-1">
                  <div
                    className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      activeTab === "wallet"
                        ? "bg-white/30 dark:bg-white/20 shadow-lg backdrop-blur-sm border border-white/40 dark:border-white/30 scale-110"
                        : "bg-white/10 dark:bg-white/5 group-hover:bg-white/20 dark:group-hover:bg-white/10 group-hover:scale-105 backdrop-blur-sm"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 flex items-center justify-center transition-colors duration-300 ${
                        activeTab === "wallet"
                          ? "text-primary"
                          : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                      }`}
                    >
                      <WalletIcon width="20" height="20" />
                    </div>

                    {/* Glass shine effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
                  </div>
                  <span
                    className={`text-xs font-medium transition-all duration-300 ${
                      activeTab === "wallet"
                        ? "text-primary font-semibold"
                        : "text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300"
                    }`}
                  >
                    Wallet
                  </span>
                </div>
              </button>

              <button
                onClick={() => setShowAccountMenu(true)}
                className="flex flex-col items-center justify-center py-2 group transition-all duration-300"
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 bg-white/10 dark:bg-white/5 group-hover:bg-white/20 dark:group-hover:bg-white/10 group-hover:scale-105 backdrop-blur-sm">
                    <div className="w-5 h-5 flex items-center justify-center transition-colors duration-300 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>

                    {/* Glass shine effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
                  </div>
                  <span className="text-xs font-medium transition-all duration-300 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300">
                    Account
                  </span>
                </div>
              </button>
            </div>
          </div>

          <TabsContent value="fixtures" className="space-y-8">
            <GameSelection />
          </TabsContent>

          <TabsContent value="create" className="space-y-8">
            <SquadManagerWithConditionalTabs
              squadSubTab={squadSubTab}
              setSquadSubTab={setSquadSubTab}
            />
          </TabsContent>

          <TabsContent value="games" className="space-y-8">
            <MyPicks onEditPicks={() => setActiveTab("fixtures")} />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-8">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="wallet" className="space-y-8">
            <Wallet />
          </TabsContent>
        </Tabs>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      <AccountMenu open={showAccountMenu} onOpenChange={setShowAccountMenu} />
      
      {/* Squad Join Confirmation Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Join Squad
            </DialogTitle>
            <DialogDescription>
              You've been invited to join a squad! Would you like to join using the code{" "}
              <span className="font-mono font-bold text-foreground bg-muted px-2 py-1 rounded">
                {pendingJoinCode}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCancelJoin}
              disabled={joiningSquad}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmJoin}
              disabled={joiningSquad}
              className="w-full sm:w-auto"
            >
              {joiningSquad ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Squad
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;