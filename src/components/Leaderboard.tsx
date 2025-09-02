import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Loader2 } from "lucide-react";
import { getDisplayName, getInitials } from "@/lib/utils/user";
import { useSeasonLeaderboard, useWeeklyLeaderboard } from "@/hooks/use-leaderboard";
import { useAuth } from "@/hooks/use-auth";

interface LeaderboardDisplayEntry {
  rank: number;
  username: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  wins: number;
  losses: number;
  winPercentage: number;
  points: number;
  isCurrentUser?: boolean;
}

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

const LeaderboardTable = ({ data }: { data: LeaderboardDisplayEntry[] }) => (
  <div className="bg-card border border-border rounded-lg shadow-sm">
    <div className="p-3 border-b border-border">
      <h3 className="font-semibold text-sm text-foreground">Rankings</h3>
    </div>
    <div className="divide-y divide-border">
      {data.map((entry, index) => (
        <div 
          key={entry.rank}
          className={`flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-colors ${
            entry.isCurrentUser ? 'bg-primary/5 border-l-2 border-l-primary' : ''
          } ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''} ${
            index === 1 ? 'bg-gradient-to-r from-gray-50 to-transparent' : ''
          } ${index === 2 ? 'bg-gradient-to-r from-orange-50 to-transparent' : ''}`}
        >
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
              {getRankIcon(entry.rank)}
            </div>
            
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarFallback className="text-xs font-medium">
                  {getInitials({
                    username: entry.username, 
                    displayName: entry.displayName,
                    firstName: entry.firstName,
                    lastName: entry.lastName
                  })}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className={`text-sm font-medium truncate ${entry.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                  {getDisplayName({
                    username: entry.username,
                    displayName: entry.displayName,
                    firstName: entry.firstName,
                    lastName: entry.lastName
                  })}
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {entry.wins}W - {entry.losses}L
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-foreground">{entry.winPercentage}%</div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </div>
            
            <div className="text-right">
              <div className="font-bold text-primary text-sm sm:text-base">{entry.points}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
            
            {/* Mobile compact view */}
            <div className="text-right sm:hidden">
              <div className="text-xs text-muted-foreground">{entry.winPercentage}%</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("week");
  const { user } = useAuth();
  
  // For now, use current week - we'll need to implement week detection later
  const currentWeekId = "2025-W1";
  const seasonLeaderboard = useSeasonLeaderboard();
  const weeklyLeaderboard = useWeeklyLeaderboard(currentWeekId);
  
  // Transform API data to display format and mark current user
  const transformLeaderboardData = (apiData: any[]): LeaderboardDisplayEntry[] => {
    return apiData.map(entry => ({
      ...entry,
      isCurrentUser: user ? entry.userId === user.id : false
    }));
  };

  const weeklyData = transformLeaderboardData(weeklyLeaderboard.data);
  const seasonData = transformLeaderboardData(seasonLeaderboard.data);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Global Leaderboard</h2>
        <p className="text-muted-foreground">See how you stack up against the competition</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto mb-6">
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="season">Season Total</TabsTrigger>
        </TabsList>

        <TabsContent value="week">
          {weeklyLeaderboard.loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading weekly leaderboard...</span>
            </div>
          ) : weeklyLeaderboard.error ? (
            <div className="text-center p-8 text-red-600">
              <p>Error loading weekly leaderboard: {weeklyLeaderboard.error}</p>
              <button 
                onClick={weeklyLeaderboard.refetch}
                className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
              >
                Retry
              </button>
            </div>
          ) : (
            <LeaderboardTable data={weeklyData} />
          )}
        </TabsContent>

        <TabsContent value="season">
          {seasonLeaderboard.loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading season leaderboard...</span>
            </div>
          ) : seasonLeaderboard.error ? (
            <div className="text-center p-8 text-red-600">
              <p>Error loading season leaderboard: {seasonLeaderboard.error}</p>
              <button 
                onClick={seasonLeaderboard.refetch}
                className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
              >
                Retry
              </button>
            </div>
          ) : (
            <LeaderboardTable data={seasonData} />
          )}
        </TabsContent>
      </Tabs>

      {/* Points System Info */}
      <Card className="bg-muted/30 border-border">
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <p><strong>Points System:</strong> Winning Pick = 10 points • Rankings by total points, then win percentage</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;