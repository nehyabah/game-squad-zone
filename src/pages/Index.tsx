import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SquadManager from "@/components/SquadManager";
import GameSelection from "@/components/GameSelection";
import Leaderboard from "@/components/Leaderboard";
import AuthModal from "@/components/AuthModal";
import CountdownTimer from "@/components/CountdownTimer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Users } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("fixtures");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();

  // Show auth prompt for non-logged in users
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header onAuthClick={() => setShowAuthModal(true)} />
        
        {/* Hero Section */}
        <HeroSection />

        {/* Auth Required Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <Card className="max-w-sm sm:max-w-md mx-auto border border-primary/20 bg-primary/5">
            <CardContent className="p-6 sm:p-8 text-center space-y-4 sm:space-y-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              
              <div>
                <h3 className="font-display font-semibold text-lg sm:text-xl text-foreground mb-2">
                  Login Required
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Create an account or login to start creating squads, making picks, and competing with friends!
                </p>
              </div>

              <Button variant="squad" onClick={() => setShowAuthModal(true)} className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>

        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onAuthClick={() => setShowAuthModal(true)} />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-20 sm:pb-8">
        <div className="text-center mb-4 sm:mb-8">
          <h2 className="text-xl sm:text-3xl font-display font-bold text-foreground mb-1 sm:mb-2">
            Welcome back, {user.username}! 👋
          </h2>
          <p className="text-muted-foreground text-xs sm:text-base">Ready to make your picks?</p>
        </div>

        <CountdownTimer />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Tabs */}
          <TabsList className="hidden sm:grid w-full grid-cols-4 max-w-2xl mx-auto mb-16 h-12 bg-primary/10 backdrop-blur-md border border-primary/20 rounded-xl p-1 shadow-lg">
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
              Ranking
            </TabsTrigger>
          </TabsList>

          {/* Mobile Bottom Tabs - iOS Style */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 sm:hidden">
            <div className="grid grid-cols-4 h-20 safe-area-pb">
              <button
                onClick={() => setActiveTab("fixtures")}
                className="flex flex-col items-center justify-center py-2 transition-colors duration-200"
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className={`w-6 h-6 flex items-center justify-center transition-colors duration-200 ${
                    activeTab === "fixtures" ? "text-primary" : "text-gray-400 dark:text-gray-500"
                  }`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <span className={`text-xs font-medium transition-colors duration-200 ${
                    activeTab === "fixtures" ? "text-primary" : "text-gray-500 dark:text-gray-400"
                  }`}>
                    Fixtures
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab("create")}
                className="flex flex-col items-center justify-center py-2 transition-colors duration-200"
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className={`w-6 h-6 flex items-center justify-center transition-colors duration-200 ${
                    activeTab === "create" ? "text-primary" : "text-gray-400 dark:text-gray-500"
                  }`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <span className={`text-xs font-medium transition-colors duration-200 ${
                    activeTab === "create" ? "text-primary" : "text-gray-500 dark:text-gray-400"
                  }`}>
                    Squads
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab("games")}
                className="flex flex-col items-center justify-center py-2 transition-colors duration-200"
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className={`w-6 h-6 flex items-center justify-center transition-colors duration-200 ${
                    activeTab === "games" ? "text-primary" : "text-gray-400 dark:text-gray-500"
                  }`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="6"/>
                      <circle cx="12" cy="12" r="2"/>
                    </svg>
                  </div>
                  <span className={`text-xs font-medium transition-colors duration-200 ${
                    activeTab === "games" ? "text-primary" : "text-gray-500 dark:text-gray-400"
                  }`}>
                    My Picks
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab("leaderboard")}
                className="flex flex-col items-center justify-center py-2 transition-colors duration-200"
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className={`w-6 h-6 flex items-center justify-center transition-colors duration-200 ${
                    activeTab === "leaderboard" ? "text-primary" : "text-gray-400 dark:text-gray-500"
                  }`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                      <path d="M4 22h16"/>
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                    </svg>
                  </div>
                  <span className={`text-xs font-medium transition-colors duration-200 ${
                    activeTab === "leaderboard" ? "text-primary" : "text-gray-500 dark:text-gray-400"
                  }`}>
                    Ranking
                  </span>
                </div>
              </button>
            </div>
          </div>

          <TabsContent value="fixtures" className="space-y-8">
            <GameSelection />
          </TabsContent>

          <TabsContent value="create" className="space-y-8">
            <SquadManager />
          </TabsContent>

          <TabsContent value="games" className="space-y-8">
            <div className="text-center">
              <h3 className="text-xl font-display font-semibold text-foreground mb-4">My Current Picks</h3>
              <p className="text-muted-foreground">Your picks for this week will appear here</p>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-8">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
};

export default Index;
