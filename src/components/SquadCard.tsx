import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Crown, Calendar } from "lucide-react";

interface SquadCardProps {
  squad: {
    id: string;
    name: string;
    memberCount: number;
    joinCode: string;
    createdAt: string;
    isOwner: boolean;
  };
  onJoinSquad?: (squadId: string) => void;
  onViewSquad?: (squadId: string) => void;
}

const SquadCard = ({ squad, onJoinSquad, onViewSquad }: SquadCardProps) => {
  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-white/10 backdrop-blur-md border border-white/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-lg text-white truncate">
                {squad.name}
              </h3>
              {squad.isOwner && (
                <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-white/70">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{squad.memberCount} members</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{squad.createdAt}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/10 rounded-lg px-3 py-2">
            <p className="text-xs text-white/60 mb-1">Join Code</p>
            <p className="font-mono font-bold text-sm text-white tracking-wider">
              {squad.joinCode}
            </p>
          </div>
          
          <div className="flex gap-2">
            {!squad.isOwner && onJoinSquad && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onJoinSquad(squad.id)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Join
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewSquad?.(squad.id)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SquadCard;