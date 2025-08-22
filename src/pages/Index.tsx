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
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-primary/20 sm:hidden">
            <div className="grid grid-cols-4 h-16 max-w-full mx-auto">
              <button
                onClick={() => setActiveTab("fixtures")}
                className={`flex flex-col items-center justify-center text-xs font-medium transition-colors px-1 ${
                  activeTab === "fixtures" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-1 ${
                  activeTab === "fixtures" ? "bg-primary/20 text-primary" : ""
                }`}>
                  📅
                </div>
                <span className="text-[10px] leading-none">Fixtures</span>
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`flex flex-col items-center justify-center text-xs font-medium transition-colors px-1 ${
                  activeTab === "create" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-1 ${
                  activeTab === "create" ? "bg-primary/20 text-primary" : ""
                }`}>
                  👥
                </div>
                <span className="text-[10px] leading-none">Squads</span>
              </button>
              <button
                onClick={() => setActiveTab("games")}
                className={`flex flex-col items-center justify-center text-xs font-medium transition-colors px-1 ${
                  activeTab === "games" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-1 ${
                  activeTab === "games" ? "bg-primary/20 text-primary" : ""
                }`}>
                  🎯
                </div>
                <span className="text-[10px] leading-none">My Picks</span>
              </button>
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`flex flex-col items-center justify-center text-xs font-medium transition-colors px-1 ${
                  activeTab === "leaderboard" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-1 ${
                  activeTab === "leaderboard" ? "bg-primary/20 text-primary" : ""
                }`}>
                  🏆
                </div>
                <span className="text-[10px] leading-none">Ranking</span>
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
