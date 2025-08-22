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

          {/* Mobile Bottom Tabs */}
          <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
            {/* Glass morphism background */}
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-white/20"></div>
            
            {/* Active tab indicator */}
            <div className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 ease-out"
                 style={{
                   width: '25%',
                   transform: `translateX(${
                     activeTab === 'fixtures' ? '0%' : 
                     activeTab === 'create' ? '100%' : 
                     activeTab === 'games' ? '200%' : '300%'
                   })`
                 }}>
            </div>
            
            <div className="relative grid grid-cols-4 h-20 max-w-full mx-auto">
              <button
                onClick={() => setActiveTab("fixtures")}
                className={`group flex flex-col items-center justify-center transition-all duration-300 ease-out ${
                  activeTab === "fixtures" 
                    ? "transform -translate-y-1" 
                    : "hover:transform hover:-translate-y-0.5"
                }`}
              >
                <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center mb-1 transition-all duration-300 ease-out ${
                  activeTab === "fixtures" 
                    ? "bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg scale-110 border border-primary/30" 
                    : "bg-white/10 dark:bg-gray-800/20 group-hover:bg-white/20 group-hover:scale-105"
                }`}>
                  <span className={`text-lg transition-all duration-300 ${
                    activeTab === "fixtures" ? "scale-110" : "group-hover:scale-105"
                  }`}>📅</span>
                  
                  {activeTab === "fixtures" && (
                    <div className="absolute -inset-2 bg-primary/20 rounded-3xl animate-pulse"></div>
                  )}
                </div>
                <span className={`text-xs font-medium transition-all duration-300 ${
                  activeTab === "fixtures" 
                    ? "text-primary font-semibold" 
                    : "text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200"
                }`}>
                  Fixtures
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab("create")}
                className={`group flex flex-col items-center justify-center transition-all duration-300 ease-out ${
                  activeTab === "create" 
                    ? "transform -translate-y-1" 
                    : "hover:transform hover:-translate-y-0.5"
                }`}
              >
                <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center mb-1 transition-all duration-300 ease-out ${
                  activeTab === "create" 
                    ? "bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg scale-110 border border-primary/30" 
                    : "bg-white/10 dark:bg-gray-800/20 group-hover:bg-white/20 group-hover:scale-105"
                }`}>
                  <span className={`text-lg transition-all duration-300 ${
                    activeTab === "create" ? "scale-110" : "group-hover:scale-105"
                  }`}>👥</span>
                  
                  {activeTab === "create" && (
                    <div className="absolute -inset-2 bg-primary/20 rounded-3xl animate-pulse"></div>
                  )}
                </div>
                <span className={`text-xs font-medium transition-all duration-300 ${
                  activeTab === "create" 
                    ? "text-primary font-semibold" 
                    : "text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200"
                }`}>
                  Squads
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab("games")}
                className={`group flex flex-col items-center justify-center transition-all duration-300 ease-out ${
                  activeTab === "games" 
                    ? "transform -translate-y-1" 
                    : "hover:transform hover:-translate-y-0.5"
                }`}
              >
                <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center mb-1 transition-all duration-300 ease-out ${
                  activeTab === "games" 
                    ? "bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg scale-110 border border-primary/30" 
                    : "bg-white/10 dark:bg-gray-800/20 group-hover:bg-white/20 group-hover:scale-105"
                }`}>
                  <span className={`text-lg transition-all duration-300 ${
                    activeTab === "games" ? "scale-110" : "group-hover:scale-105"
                  }`}>🎯</span>
                  
                  {activeTab === "games" && (
                    <div className="absolute -inset-2 bg-primary/20 rounded-3xl animate-pulse"></div>
                  )}
                </div>
                <span className={`text-xs font-medium transition-all duration-300 ${
                  activeTab === "games" 
                    ? "text-primary font-semibold" 
                    : "text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200"
                }`}>
                  My Picks
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`group flex flex-col items-center justify-center transition-all duration-300 ease-out ${
                  activeTab === "leaderboard" 
                    ? "transform -translate-y-1" 
                    : "hover:transform hover:-translate-y-0.5"
                }`}
              >
                <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center mb-1 transition-all duration-300 ease-out ${
                  activeTab === "leaderboard" 
                    ? "bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg scale-110 border border-primary/30" 
                    : "bg-white/10 dark:bg-gray-800/20 group-hover:bg-white/20 group-hover:scale-105"
                }`}>
                  <span className={`text-lg transition-all duration-300 ${
                    activeTab === "leaderboard" ? "scale-110" : "group-hover:scale-105"
                  }`}>🏆</span>
                  
                  {activeTab === "leaderboard" && (
                    <div className="absolute -inset-2 bg-primary/20 rounded-3xl animate-pulse"></div>
                  )}
                </div>
                <span className={`text-xs font-medium transition-all duration-300 ${
                  activeTab === "leaderboard" 
                    ? "text-primary font-semibold" 
                    : "text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200"
                }`}>
                  Ranking
                </span>
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
