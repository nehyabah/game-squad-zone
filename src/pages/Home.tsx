import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SquadManager from "@/components/SquadManager";
import SquadManagerWithConditionalTabs from "@/components/SquadManagerWithConditionalTabs";
import GameSelection from "@/components/GameSelection";
import MyPicks from "@/components/MyPicks";
import TeamLogosBanner from "@/components/TeamLogosBanner";
import Leaderboard from "@/components/Leaderboard";
import AuthModal from "@/components/AuthModal";
import AccountMenu from "@/components/AccountMenu";
import CountdownTimer from "@/components/CountdownTimer";
import Wallet from "@/components/Wallet";
import UpcomingGames from "@/components/UpcomingGames";
import PickHistory from "@/components/PickHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDisplayName } from "@/lib/utils/user";
import { WalletIcon } from "lucide-react";

const Home = () => {
  const [activeTab, setActiveTab] = useState("fixtures");
  const [squadSubTab, setSquadSubTab] = useState("chat");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header onAuthClick={() => setShowAuthModal(true)} />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-8">
        {activeTab === "fixtures" && (
          <>
            <div className="text-center mb-4 sm:mb-8">
              <h2 className="text-xl sm:text-3xl font-display font-bold text-foreground mb-1 sm:mb-2">
                Welcome back, {user && getDisplayName(user)}! 👋
              </h2>
              <p className="text-muted-foreground text-xs sm:text-base">
                Ready to make your picks?
              </p>
            </div>
            <TeamLogosBanner />
          </>
        )}

        {activeTab !== "create" && activeTab !== "wallet" && <CountdownTimer />}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden sm:grid w-full grid-cols-4 max-w-3xl mx-auto mb-16 h-12 bg-primary/10 backdrop-blur-md border border-primary/20 rounded-xl p-1 shadow-lg">
            {/* Desktop Tabs */}
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
              Create
            </TabsTrigger>
            <TabsTrigger
              value="games"
              className="font-medium text-sm px-2 py-2 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:backdrop-blur-sm data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-200 text-primary/60 hover:text-primary/80"
            >
              Games
            </TabsTrigger>
            <TabsTrigger
              value="wallet"
              className="font-medium text-sm px-2 py-2 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:backdrop-blur-sm data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-200 text-primary/60 hover:text-primary/80"
            >
              Wallet
            </TabsTrigger>
          </TabsList>

          {/* Mobile Bottom Tabs */}
          <div className="fixed bottom-0 left-0 right-0 z-[100] sm:hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-white/95 to-white/80 dark:from-gray-900/95 dark:to-gray-800/80 backdrop-blur-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/40 dark:via-gray-700/20 dark:to-gray-600/40"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-gray-400/60"></div>

            <div className="relative grid grid-cols-5 h-20 safe-area-pb">
              <div className="flex flex-col items-center justify-center">
                <TabsTrigger
                  value="fixtures"
                  className="flex flex-col items-center justify-center text-primary"
                >
                  <WalletIcon className="h-5 w-5 mb-1" />
                  <span className="text-xs">Fixtures</span>
                </TabsTrigger>
              </div>
              <div className="flex flex-col items-center justify-center">
                <TabsTrigger
                  value="create"
                  className="flex flex-col items-center justify-center text-primary"
                >
                  <WalletIcon className="h-5 w-5 mb-1" />
                  <span className="text-xs">Create</span>
                </TabsTrigger>
              </div>
              <div className="flex flex-col items-center justify-center">
                <TabsTrigger
                  value="games"
                  className="flex flex-col items-center justify-center text-primary"
                >
                  <WalletIcon className="h-5 w-5 mb-1" />
                  <span className="text-xs">Games</span>
                </TabsTrigger>
              </div>
              <div className="flex flex-col items-center justify-center">
                <TabsTrigger
                  value="wallet"
                  className="flex flex-col items-center justify-center text-primary"
                >
                  <WalletIcon className="h-5 w-5 mb-1" />
                  <span className="text-xs">Wallet</span>
                </TabsTrigger>
              </div>
            </div>
          </div>

          <TabsContent value="fixtures" className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <GameSelection />
              </div>
              <div className="lg:col-span-1">
                <UpcomingGames />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-8">
            <SquadManagerWithConditionalTabs
              squadSubTab={squadSubTab}
              setSquadSubTab={setSquadSubTab}
            />
          </TabsContent>

          <TabsContent value="games" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <MyPicks onEditPicks={() => setActiveTab("fixtures")} />
              </div>
              <div>
                <PickHistory />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-8">
            <Wallet />
          </TabsContent>
        </Tabs>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      <AccountMenu open={showAccountMenu} onOpenChange={setShowAccountMenu} />
    </div>
  );
};

export default Home;
