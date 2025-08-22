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
  <div className="bg-card border border-border rounded-lg shadow-sm">
    <div className="p-4 border-b border-border">
      <h3 className="font-semibold text-foreground">Rankings</h3>
    </div>
    <div className="divide-y divide-border">
      {data.map((entry, index) => (
        <div 
          key={entry.rank}
          className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${
            entry.isCurrentUser ? 'bg-primary/5 border-l-4 border-l-primary' : ''
          } ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''} ${
            index === 1 ? 'bg-gradient-to-r from-gray-50 to-transparent' : ''
          } ${index === 2 ? 'bg-gradient-to-r from-orange-50 to-transparent' : ''}`}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8 h-8">
              {getRankIcon(entry.rank)}
            </div>
            
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-sm font-medium">
                  {entry.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className={`font-semibold ${entry.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                  {entry.username}
                </div>
                <div className="text-xs text-muted-foreground">
                  {entry.wins}W - {entry.losses}L
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="font-semibold text-foreground">{entry.winPercentage}%</div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </div>
            
            <div className="text-right">
              <div className="font-bold text-lg text-primary">{entry.points}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("week");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Squad Leaderboard</h2>
        <p className="text-muted-foreground">See how you stack up against the competition</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto mb-6">
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="season">Season Total</TabsTrigger>
        </TabsList>

        <TabsContent value="week">
          <LeaderboardTable data={mockWeeklyLeaderboard} />
        </TabsContent>

        <TabsContent value="season">
          <LeaderboardTable data={mockSeasonLeaderboard} />
        </TabsContent>
      </Tabs>

      {/* Points System Info */}
      <Card className="bg-muted/30 border-border">
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