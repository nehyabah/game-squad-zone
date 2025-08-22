import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Users, Share2, Trophy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SquadCreation = () => {
  const [squadName, setSquadName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isCreated, setIsCreated] = useState(false);

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateSquad = () => {
    if (!squadName.trim()) {
      toast({
        title: "Squad name required",
        description: "Please enter a name for your squad",
        variant: "destructive"
      });
      return;
    }

    const code = generateJoinCode();
    setJoinCode(code);
    setIsCreated(true);
    toast({
      title: "Squad created!",
      description: `${squadName} is ready for members`,
    });
  };

  const copyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      toast({
        title: "Copied!",
        description: "Join code copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually",
        variant: "destructive"
      });
    }
  };

  const shareToWhatsApp = () => {
    const message = `🏈 Join my SquadPot NFL squad "${squadName}"!\n\nUse join code: ${joinCode}\n\nLet's pick some games and compete!`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (isCreated) {
    return (
      <div className="w-full max-w-xs sm:max-w-md mx-auto">
        <Card className="overflow-hidden border-0 shadow-2xl">
          <div className="bg-gradient-to-br from-primary via-primary to-primary/80 p-4 sm:p-6 text-white relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 rounded-full bg-white/10"></div>
              <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-white/15"></div>
            </div>
            
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base">SquadPot</h3>
                    <p className="text-xs text-white/80">Squad Created</p>
                  </div>
                </div>
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                  <Trophy className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Squad Name */}
              <div className="mb-3 sm:mb-4">
                <p className="text-xs text-white/70 mb-1">Squad Name</p>
                <h2 className="font-display font-bold text-lg sm:text-xl text-white truncate">{squadName}</h2>
              </div>

              {/* Join Code */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-3 sm:mb-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/70 mb-1">Join Code</p>
                    <p className="font-mono font-bold text-xl sm:text-2xl text-white tracking-wider">{joinCode}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={copyJoinCode}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Copy className="w-3 h-3 text-white" />
                    </button>
                    <button 
                      onClick={shareToWhatsApp}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Share2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <p className="text-xs text-white/80">Ready to receive members</p>
              </div>
            </div>
          </div>
          
          {/* Bottom Action */}
          <CardContent className="p-3 sm:p-4 bg-white">
            <Button variant="squad" className="w-full h-9 text-sm font-semibold">
              <Trophy className="w-4 h-4 mr-2" />
              Go to Squad Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs sm:max-w-md mx-auto">
      <Card className="shadow-hover border border-border/50 bg-card backdrop-blur-sm">
        <CardHeader className="text-center pb-1 sm:pb-2">
          <CardTitle className="text-lg sm:text-2xl font-display text-foreground flex items-center justify-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Create Squad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="squadName" className="font-medium">Squad Name</Label>
            <Input
              id="squadName"
              value={squadName}
              onChange={(e) => setSquadName(e.target.value)}
              placeholder="Enter your squad name"
              className="transition-smooth focus:shadow-glow border-border/50 focus:border-primary"
            />
          </div>

          <div className="text-center text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 sm:p-3">
            <p>Create a squad and get a unique join code to share with friends</p>
          </div>

          <Button 
            variant="squad" 
            onClick={handleCreateSquad}
            className="w-full h-9 text-sm"
          >
            <Users className="w-4 h-4 mr-2" />
            Create Squad
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SquadCreation;