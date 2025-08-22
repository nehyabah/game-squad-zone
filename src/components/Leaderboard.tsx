import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const mockWeeklyLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: "Taylor", wins: 3, losses: 0, winPercentage: 100, points: 90 },
  { rank: 2, username: "Alex", wins: 2, losses: 1, winPercentage: 67, points: 60 },
  { rank: 3, username: "You", wins: 2, losses: 1, winPercentage: 67, points: 60, isCurrentUser: true },
  { rank: 4, username: "Jordan", wins: 2, losses: 1, winPercentage: 67, points: 60 },
  { rank: 5, username: "Ryan", wins: 1, losses: 2, winPercentage: 33, points: 30 },
  { rank: 6, username: "Chris", wins: 1, losses: 2, winPercentage: 33, points: 30 },
  { rank: 7, username: "Drew", wins: 0, losses: 3, winPercentage: 0, points: 0 },
  { rank: 8, username: "Blake", wins: 0, losses: 3, winPercentage: 0, points: 0 },
];

const mockSeasonLeaderboard: LeaderboardEntry[] = [
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
      return <Trophy className="w-4 h-4 text-yellow-500" />;
    case 2:
      return <Medal className="w-4 h-4 text-gray-400" />;
    case 3:
      return <Award className="w-4 h-4 text-amber-600" />;
    default:
      return <span className="w-4 h-4 flex items-center justify-center text-muted-foreground font-bold text-xs">{rank}</span>;
  }
};

const LeaderboardTable = ({ data }: { data: LeaderboardEntry[] }) => (
  <Card className="shadow-hover border-0 bg-gradient-card">
    <CardContent className="p-0">
      <div className="space-y-0">
        {data.map((entry) => (
          <div 
            key={entry.rank}
            className={`flex items-center justify-between p-2 sm:p-3 hover:bg-background/50 transition-smooth border-l-2 ${
              entry.isCurrentUser 
                ? 'border-primary bg-primary/5' 
                : entry.rank <= 3 
                ? 'border-accent' 
                : 'border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Rank */}
              <div className="w-6 flex justify-center">
                {getRankIcon(entry.rank)}
              </div>

              {/* User Info */}
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6 sm:w-7 sm:h-7">
                  <AvatarFallback className="text-xs">
                    {entry.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className={`text-sm font-medium ${entry.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                  {entry.username}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">W/L</div>
                <div className="text-sm font-medium text-foreground">{entry.wins}-{entry.losses}</div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Win %</div>
                <Badge variant={entry.winPercentage >= 60 ? "default" : "secondary"} className="text-xs px-1.5 py-0.5">
                  {entry.winPercentage}%
                </Badge>
              </div>

              <div className="text-center">
                <div className="text-xs text-muted-foreground">Pts</div>
                <div className="text-sm font-bold text-primary">{entry.points}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("week");

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Squad Leaderboard</h2>
        <p className="text-sm text-muted-foreground">See how you stack up against the competition</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-4 h-10 bg-primary/10 backdrop-blur-md border border-primary/20 rounded-xl p-1 shadow-lg">
          <TabsTrigger 
            value="week" 
            className="font-medium text-sm px-3 py-1.5 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:backdrop-blur-sm data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-200 text-primary/60 hover:text-primary/80"
          >
            This Week
          </TabsTrigger>
          <TabsTrigger 
            value="season" 
            className="font-medium text-sm px-3 py-1.5 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:backdrop-blur-sm data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-md data-[state=active]:text-primary transition-all duration-200 text-primary/60 hover:text-primary/80"
          >
            Season Total
          </TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="space-y-3">
          <LeaderboardTable data={mockWeeklyLeaderboard} />
        </TabsContent>

        <TabsContent value="season" className="space-y-3">
          <LeaderboardTable data={mockSeasonLeaderboard} />
        </TabsContent>
      </Tabs>

      {/* Points System Info */}
      <Card className="shadow-card border-0 bg-muted/30">
        <CardContent className="p-3">
          <div className="text-center text-xs text-muted-foreground">
            <p><strong>Points System:</strong> Win = 20 points • Perfect Week (3-0) = 30 bonus points</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;