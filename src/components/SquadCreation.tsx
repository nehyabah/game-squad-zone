import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Users, Share2 } from "lucide-react";
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
        <Card className="w-full max-w-xs sm:max-w-md mx-auto shadow-hover border border-border/50 bg-card backdrop-blur-sm">
          <CardHeader className="text-center pb-1 sm:pb-2">
            <CardTitle className="text-lg sm:text-2xl font-display text-foreground flex items-center justify-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              Squad Created!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="text-center">
              <h3 className="font-display font-semibold text-base sm:text-lg text-foreground mb-1 sm:mb-2">{squadName}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">Share this code with friends</p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4 text-center">
              <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Join Code</Label>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-primary mt-1 sm:mt-2 tracking-wider">
                {joinCode}
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyJoinCode}
                className="flex-1 h-8 text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
              <Button 
                variant="join" 
                size="sm" 
                onClick={shareToWhatsApp}
                className="flex-1 h-8 text-xs"
              >
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>
            </div>

            <Button variant="squad" className="w-full h-9 text-sm">
              Go to Squad
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-hover border border-border/50 bg-card backdrop-blur-sm">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-display text-foreground flex items-center justify-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Create Squad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
          <p>Create a squad and get a unique join code to share with friends</p>
        </div>

        <Button 
          variant="squad" 
          onClick={handleCreateSquad}
          className="w-full"
        >
          Create Squad
        </Button>
      </CardContent>
    </Card>
  );
};

export default SquadCreation;