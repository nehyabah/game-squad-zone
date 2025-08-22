import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  username: string;
  wins: number;
  losses: number;
  winPercentage: number;
  points: number;
  isCurrentUser?: boolean;
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: "Alex", wins: 12, losses: 3, winPercentage: 80, points: 240 },
  { rank: 2, username: "Jordan", wins: 11, losses: 4, winPercentage: 73, points: 220 },
  { rank: 3, username: "Taylor", wins: 10, losses: 5, winPercentage: 67, points: 200 },
  { rank: 4, username: "Ryan", wins: 9, losses: 6, winPercentage: 60, points: 180 },
  { rank: 5, username: "You", wins: 8, losses: 7, winPercentage: 53, points: 160, isCurrentUser: true },
  { rank: 6, username: "Chris", wins: 8, losses: 7, winPercentage: 53, points: 160 },
  { rank: 7, username: "Drew", wins: 7, losses: 8, winPercentage: 47, points: 140 },
  { rank: 8, username: "Blake", wins: 6, losses: 9, winPercentage: 40, points: 120 },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-muted-foreground font-bold">{rank}</span>;
  }
};

const Leaderboard = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Squad Leaderboard</h2>
        <p className="text-muted-foreground">See how you stack up against the competition</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardHeader className="text-center">
            <CardTitle className="text-lg text-foreground">This Week</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-card border-0 bg-gradient-primary">
          <CardHeader className="text-center">
            <CardTitle className="text-lg text-primary-foreground">Season Total</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-hover border-0 bg-gradient-card">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Squad Rankings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {mockLeaderboard.map((entry) => (
              <div 
                key={entry.rank}
                className={`flex items-center justify-between p-4 hover:bg-background/50 transition-smooth border-l-4 ${
                  entry.isCurrentUser 
                    ? 'border-primary bg-primary/5' 
                    : entry.rank <= 3 
                    ? 'border-accent' 
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="w-8 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {entry.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className={`font-semibold ${entry.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                        {entry.username}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">W/L</div>
                    <div className="font-semibold text-foreground">{entry.wins}-{entry.losses}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Win %</div>
                    <Badge variant={entry.winPercentage >= 60 ? "default" : "secondary"}>
                      {entry.winPercentage}%
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Points</div>
                    <div className="font-bold text-primary">{entry.points}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Points System Info */}
      <Card className="shadow-card border-0 bg-muted/30">
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <p><strong>Points System:</strong> Win = 20 points • Perfect Week (3-0) = 30 bonus points</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;