import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SquadCreation from "@/components/SquadCreation";
import GameSelection from "@/components/GameSelection";
import Leaderboard from "@/components/Leaderboard";
import AuthModal from "@/components/AuthModal";
import CountdownTimer from "@/components/CountdownTimer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Users } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("create");
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
            Welcome back, {user.username}! 👋
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">Ready to make your picks for this week?</p>
        </div>

        <CountdownTimer />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-sm sm:max-w-lg mx-auto mb-8 sm:mb-16 h-10 sm:h-12 bg-secondary/50 border border-border/50">
            <TabsTrigger value="create" className="font-medium text-xs sm:text-sm">Create Squad</TabsTrigger>
            <TabsTrigger value="games" className="font-medium text-xs sm:text-sm">My Picks</TabsTrigger>
            <TabsTrigger value="leaderboard" className="font-medium text-xs sm:text-sm">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-8">
            <SquadCreation />
          </TabsContent>

          <TabsContent value="games" className="space-y-8">
            <GameSelection />
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
