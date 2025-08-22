import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SquadCreation from "@/components/SquadCreation";
import GameSelection from "@/components/GameSelection";
import Leaderboard from "@/components/Leaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("create");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-16 h-12 bg-secondary/50 border border-border/50">
            <TabsTrigger value="create" className="font-medium">Create Squad</TabsTrigger>
            <TabsTrigger value="games" className="font-medium">Pick Games</TabsTrigger>
            <TabsTrigger value="leaderboard" className="font-medium">Leaderboard</TabsTrigger>
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
    </div>
  );
};

export default Index;
