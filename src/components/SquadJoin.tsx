import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { squadsAPI } from "@/lib/api/squads";

interface SquadJoinProps {
  onSquadJoined?: (squad: any) => void;
}

const SquadJoin = ({ onSquadJoined }: SquadJoinProps) => {
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");

  const joinRequestMutation = useMutation({
    mutationFn: (data: { joinCode: string; message?: string }) =>
      squadsAPI.createJoinRequest(data),
    onSuccess: (joinRequest) => {
      toast.success("Join request sent!", {
        description: `Your request to join "${joinRequest.squad?.name}" has been sent to the admins`,
      });
      setJoinCode("");
      setMessage("");
      onSquadJoined?.(joinRequest);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send join request");
    },
  });

  const handleJoinSquad = async () => {
    if (!joinCode.trim()) {
      toast.error("Join code required", {
        description: "Please enter a join code",
      });
      return;
    }

    const finalJoinCode = joinCode.trim().toUpperCase();

    joinRequestMutation.mutate({
      joinCode: finalJoinCode,
      message: message.trim() || undefined,
    });
  };

  return (
    <div className="w-full max-w-xs sm:max-w-md mx-auto">
      <Card className="shadow-hover border border-border/50 bg-card backdrop-blur-sm">
        <CardHeader className="text-center pb-1 sm:pb-2">
          <CardTitle className="text-lg sm:text-2xl font-display text-foreground flex items-center justify-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Request to Join Squad
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleJoinSquad();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="font-medium text-sm">
              Message (Optional)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce yourself to the squad admins..."
              className="transition-smooth focus:shadow-glow border-border/50 focus:border-primary min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500
            </p>
          </div>

          <div className="text-center text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 sm:p-3">
            <p>Your request will be sent to squad admins for approval</p>
          </div>

          <Button
            variant="squad"
            onClick={handleJoinSquad}
            disabled={joinRequestMutation.isPending || !joinCode.trim()}
            className="w-full h-9 text-sm"
          >
            {joinRequestMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {joinRequestMutation.isPending ? "Sending Request..." : "Send Join Request"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SquadJoin;