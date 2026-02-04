import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.tsx";
import { useSport, Sport } from "@/hooks/use-sport.tsx";
import { useSquads } from "@/hooks/use-squads";
import { toast } from "@/hooks/use-toast";
import LoginPage from "@/components/LoginPage";
import ProfileSetup from "@/components/ProfileSetup";
import SportSelectionScreen from "@/components/SportSelectionScreen";
import Header from "@/components/Header";
import SquadManagerWithConditionalTabs from "@/components/SquadManagerWithConditionalTabs";
import GameSelection from "@/components/GameSelection";
import SixNationsQuestionPicker from "@/components/SixNationsQuestionPicker";
import MyPicks from "@/components/MyPicks";
import MySixNationsPicks from "@/components/MySixNationsPicks";
import TeamLogosBanner from "@/components/TeamLogosBanner";
import AuthModal from "@/components/AuthModal";
import AccountMenu from "@/components/AccountMenu";
import CountdownTimer from "@/components/CountdownTimer";
import Leaderboard from "@/components/Leaderboard";
import NotificationPermissionBanner from "@/components/NotificationPermissionBanner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Loader2, Globe } from "lucide-react";
import { getDisplayName } from "@/lib/utils/user";
import { squadsAPI } from "@/lib/api/squads";

interface IndexProps {
  sport?: Sport;
}

const Index = ({ sport: routeSport }: IndexProps = {}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("fixtures");
  const [squadSubTab, setSquadSubTab] = useState("chat");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSportSelector, setShowSportSelector] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);
  const [joiningSquad, setJoiningSquad] = useState(false);
  const [switchingSport, setSwitchingSport] = useState(false);
  const [loadingSportName, setLoadingSportName] = useState<string>("");
  const { user, loading, profileSetupRequired } = useAuth();
  const { selectedSport, setSelectedSport, hasSportSelection } = useSport();
  const { joinSquad } = useSquads();

  // Helper to change tab and close sport selector
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowSportSelector(false);
  };

  // Handle sport selection from route
  useEffect(() => {
    if (routeSport && routeSport !== selectedSport) {
      setSelectedSport(routeSport);
    }
  }, [routeSport, selectedSport, setSelectedSport]);

  // Redirect to sport-specific route when sport is selected
  useEffect(() => {
    // Don't redirect if we're on certain routes like /admin
    const currentPath = window.location.pathname;
    if (
      currentPath.startsWith("/admin") ||
      currentPath.startsWith("/auth") ||
      currentPath.startsWith("/success")
    ) {
      return;
    }

    if (hasSportSelection && !routeSport) {
      const path = selectedSport === "nfl" ? "/nfl" : "/six-nations";
      navigate(path, { replace: true });
    }
  }, [hasSportSelection, selectedSport, routeSport, navigate]);

  // Handle squad joining from URL parameter
  useEffect(() => {
    const handleUrlJoinCode = () => {
      if (!user || loading) return;

      const urlParams = new URLSearchParams(window.location.search);
      const joinCode = urlParams.get("joinCode");

      if (joinCode) {
        // Store the join code and show confirmation modal
        setPendingJoinCode(joinCode.toUpperCase());
        setShowJoinModal(true);

        // Clean up URL parameter immediately
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    };

    handleUrlJoinCode();
  }, [user, loading]);

  // Add global error handler for browser extension issues
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // Suppress browser extension errors
      if (
        event.filename?.includes("web-client-content-script.js") ||
        event.filename?.includes("extension") ||
        event.message?.includes("MutationObserver")
      ) {
        event.preventDefault();
        console.warn("Suppressed browser extension error:", event.message);
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Log but don't crash on unhandled promise rejections
      console.error("Unhandled promise rejection:", event.reason);
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  // Handle confirmed squad joining
  const handleConfirmJoin = async () => {
    if (!pendingJoinCode) return;

    setJoiningSquad(true);

    try {
      const joinRequest = await squadsAPI.createJoinRequest({
        joinCode: pendingJoinCode,
      });

      if (joinRequest) {
        toast({
          title: "Join request sent! 📨",
          description: `Your request to join "${joinRequest.squad?.name}" has been sent to the admins. You'll be notified when it's approved.`,
          duration: 5000,
        });

        setShowJoinModal(false);
        setPendingJoinCode(null);
      }
    } catch (error: any) {
      console.error("Failed to send join request:", error);
      toast({
        title: "Couldn't send join request",
        description:
          error.message || "The join code may be invalid or expired.",
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

  // Handle sport selection
  const handleSportChange = async (sport: "nfl" | "six-nations") => {
    // Show loading screen
    setLoadingSportName(sport === "nfl" ? "NFL" : "Six Nations");
    setSwitchingSport(true);
    setShowSportSelector(false);

    // Wait a moment for the animation
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Switch sport and navigate
    setSelectedSport(sport);
    setActiveTab("fixtures");
    const path = sport === "nfl" ? "/nfl" : "/six-nations";
    navigate(path);

    // Hide loading screen
    await new Promise((resolve) => setTimeout(resolve, 300));
    setSwitchingSport(false);
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

  // Show sport selection if user hasn't selected a sport yet
  if (!hasSportSelection) {
    return <SportSelectionScreen />;
  }

  // Show main app if authenticated and profile is complete
  return (
    <div
      key={selectedSport}
      className="min-h-screen bg-background animate-in fade-in duration-500"
    >
      <Header onAuthClick={() => setShowAuthModal(true)} />
      <NotificationPermissionBanner />
      <PWAInstallPrompt />

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

        {activeTab !== "create" && selectedSport === "nfl" && <CountdownTimer />}

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
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
              Global Leaderboard
            </TabsTrigger>
            <button
              onClick={() => setShowSportSelector(true)}
              className="font-medium text-sm px-2 py-2 rounded-lg transition-all duration-200 text-primary/60 hover:text-primary/80 hover:bg-primary/10 flex items-center justify-center gap-1"
            >
              <Globe className="w-4 h-4" />
              Sport
            </button>
          </TabsList>

          {/* Mobile Bottom Tabs - iOS Style with Glass Effect */}
          <div className="fixed bottom-0 left-0 right-0 z-[9999] sm:hidden">
            {/* Glass morphism background with layered effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/95 to-white/80 dark:from-gray-900/95 dark:to-gray-800/80 backdrop-blur-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/40 dark:via-gray-700/20 dark:to-gray-600/40"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-gray-400/60"></div>

            <div className="relative grid grid-cols-5 h-20 safe-area-pb">
              <button
                onClick={() => setShowSportSelector(true)}
                className="flex flex-col items-center justify-center py-2 group transition-all duration-300"
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 bg-white/10 dark:bg-white/5 group-hover:bg-white/20 dark:group-hover:bg-white/10 group-hover:scale-105 backdrop-blur-sm">
                    <div className="w-5 h-5 flex items-center justify-center transition-colors duration-300 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                      <Globe width="20" height="20" />
                    </div>

                    {/* Glass shine effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
                  </div>
                  <span className="text-xs font-medium transition-all duration-300 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300">
                    Sport
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleTabChange("fixtures")}
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
                onClick={() => handleTabChange("create")}
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
                onClick={() => handleTabChange("games")}
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
            {selectedSport === "six-nations" ? (
              <SixNationsQuestionPicker />
            ) : (
              <GameSelection />
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-8">
            <SquadManagerWithConditionalTabs
              squadSubTab={squadSubTab}
              setSquadSubTab={setSquadSubTab}
            />
          </TabsContent>

          <TabsContent value="games" className="space-y-8">
            {selectedSport === "six-nations" ? (
              <MySixNationsPicks />
            ) : (
              <MyPicks onEditPicks={() => handleTabChange("fixtures")} />
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-8">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Sport Switching Loading Screen */}
      {switchingSport && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          {/* Background Layer: Deep blur + Radial Gradient for focus */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background/80 to-background z-0" />

          {/* Main Content Container */}
          <div className="relative z-10 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Logo Section */}
            <div className="relative mb-12 group">
              {/* Outer Rotating Ring (The sleek spinner) */}
              <div className="absolute inset-[-20px] rounded-full border border-primary/20 animate-[spin_4s_linear_infinite]" />
              <div className="absolute inset-[-20px] rounded-full border-t border-primary/60 animate-[spin_2s_linear_infinite]" />
              <div className="absolute inset-[-8px] rounded-full border border-white/5" />

              {/* Glow Effect behind logo */}
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse-fast" />

              {/* The Logo Container */}
              <div className="relative h-32 w-32 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl animate-float">
                <img
                  src={
                    loadingSportName === "NFL"
                      ? "/nfl-logo.png"
                      : "/6Nations.png"
                  }
                  alt={loadingSportName}
                  className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                />
              </div>
            </div>

            {/* Text Section */}
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-sm">
                {loadingSportName}
              </h2>

              <div className="flex items-center gap-3">
                <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-primary/50"></span>
                <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase animate-pulse">
                  Switching Portals
                </p>
                <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-primary/50"></span>
              </div>
            </div>
          </div>
        </div>
      )}
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
              You've been invited to join a squad! Would you like to join using
              the code{" "}
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

      {/* Sport Selector Modal - Compact Design */}
      <Dialog open={showSportSelector} onOpenChange={setShowSportSelector}>
        <DialogContent className="sm:max-w-md p-4 sm:p-6 border-none bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur-xl shadow-2xl">
          <DialogHeader className="space-y-1 sm:space-y-2">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              Select Sport
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground/70">
              Choose your competition
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 py-3 sm:py-4">
            {/* NFL Card */}
            <button
              onClick={() => handleSportChange("nfl")}
              className={`group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl transition-all duration-300 ${
                selectedSport === "nfl"
                  ? "bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-lg shadow-primary/20 ring-2 ring-primary/50"
                  : "bg-gradient-to-br from-muted/50 to-muted/30 hover:from-primary/10 hover:to-primary/5 hover:shadow-md border border-border/50"
              }`}
            >
              {/* Active indicator */}
              {selectedSport === "nfl" && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-primary rounded-full shadow-lg"></div>
              )}

              {/* Logo */}
              <div
                className={`relative mb-2 sm:mb-3 transition-all duration-300 ${
                  selectedSport === "nfl"
                    ? "scale-105"
                    : "group-hover:scale-105"
                }`}
              >
                <img
                  src="/nfl-logo.png"
                  alt="NFL"
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain relative z-10"
                />
              </div>

              {/* Sport name */}
              <span
                className={`font-bold text-sm sm:text-base transition-all duration-300 ${
                  selectedSport === "nfl"
                    ? "text-primary"
                    : "text-foreground group-hover:text-primary"
                }`}
              >
                NFL
              </span>

              {/* Description */}
              <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 text-center">
                American Football
              </span>
            </button>

            {/* Six Nations Card */}
            <button
              onClick={() => handleSportChange("six-nations")}
              className={`group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl transition-all duration-300 ${
                selectedSport === "six-nations"
                  ? "bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-lg shadow-primary/20 ring-2 ring-primary/50"
                  : "bg-gradient-to-br from-muted/50 to-muted/30 hover:from-primary/10 hover:to-primary/5 hover:shadow-md border border-border/50"
              }`}
            >
              {/* Active indicator */}
              {selectedSport === "six-nations" && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-primary rounded-full shadow-lg"></div>
              )}

              {/* Logo */}
              <div
                className={`relative mb-2 sm:mb-3 transition-all duration-300 ${
                  selectedSport === "six-nations"
                    ? "scale-105"
                    : "group-hover:scale-105"
                }`}
              >
                <img
                  src="/6Nations.png"
                  alt="Six Nations"
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain relative z-10"
                />
              </div>

              {/* Sport name */}
              <span
                className={`font-bold text-sm sm:text-base transition-all duration-300 ${
                  selectedSport === "six-nations"
                    ? "text-primary"
                    : "text-foreground group-hover:text-primary"
                }`}
              >
                Six Nations
              </span>

              {/* Description */}
              <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 text-center">
                Rugby Union
              </span>
            </button>
          </div>

          {/* Footer hint */}
          <div className="pt-1 pb-0 text-center">
            <span className="text-[10px] sm:text-xs text-muted-foreground/60">
              Switch anytime from navigation
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
