import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSquads } from "@/hooks/use-squads";

interface SquadJoinProps {
  onSquadJoined?: (squad: any) => void;
}

const SquadJoin = ({ onSquadJoined }: SquadJoinProps) => {
  const [joinCode, setJoinCode] = useState("");
  const { joinSquad, loading } = useSquads();

  const handleJoinSquad = async () => {
    console.log("handleJoinSquad called, joinCode state:", joinCode);
    console.log("joinCode length:", joinCode.length);
    console.log("joinCode trimmed:", joinCode.trim());
    console.log("joinCode trimmed length:", joinCode.trim().length);
    
    if (!joinCode.trim()) {
      toast({
        title: "Join code required",
        description: "Please enter a join code",
        variant: "destructive"
      });
      return;
    }

    const finalJoinCode = joinCode.trim().toUpperCase();
    console.log("Final join code to send:", finalJoinCode);
    
    const squad = await joinSquad({
      joinCode: finalJoinCode
    });

    if (squad) {
      // Notify parent component
      onSquadJoined?.(squad);
      
      // Reset form
      setJoinCode("");
    }
  };

  return (
    <div className="w-full max-w-xs sm:max-w-md mx-auto">
      <Card className="shadow-hover border border-border/50 bg-card backdrop-blur-sm">
        <CardHeader className="text-center pb-1 sm:pb-2">
          <CardTitle className="text-lg sm:text-2xl font-display text-foreground flex items-center justify-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Join Squad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="joinCode" className="font-medium">Join Code</Label>
            <Input
              id="joinCode"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter squad join code"
              className="transition-smooth focus:shadow-glow border-border/50 focus:border-primary font-mono text-center tracking-wider uppercase"
              maxLength={12}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleJoinSquad();
                }
              }}
            />
          </div>

          <div className="text-center text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 sm:p-3">
            <p>Enter the join code provided by the squad owner to join their squad</p>
          </div>

          <Button 
            variant="squad" 
            onClick={handleJoinSquad}
            disabled={loading || !joinCode.trim()}
            className="w-full h-9 text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Users className="w-4 h-4 mr-2" />
            )}
            {loading ? "Joining..." : "Join Squad"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SquadJoin;