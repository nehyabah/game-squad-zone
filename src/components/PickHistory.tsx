import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Calendar, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { picksApi, PickSet } from "@/lib/api/picks";

const PickHistory = () => {
  const [history, setHistory] = useState<PickSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await picksApi.getPickHistory();
      setHistory(data);
    } catch (error) {
      console.error("Error loading pick history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatWeek = (weekId: string) => {
    // Convert "YYYY-WN" to "Week N" (e.g., "2025-W1" to "Week 1")
    const match = weekId.match(/W(\d+)/);
    return match ? `Week ${match[1]}` : weekId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'default';
      case 'locked': return 'secondary';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  const getPickChoice = (choice: 'home' | 'away', homeTeam: string, awayTeam: string) => {
    return choice === 'home' ? homeTeam : awayTeam;
  };

  const getPickResult = (pick: any) => {
    if (!pick.game?.completed) return null;
    
    const { homeScore, awayScore } = pick.game;
    const actualWinner = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'tie';
    
    if (actualWinner === 'tie') return { result: 'push', icon: <Minus className="w-3 h-3" /> };
    if (pick.choice === actualWinner) return { result: 'win', icon: <TrendingUp className="w-3 h-3 text-green-600" /> };
    return { result: 'loss', icon: <TrendingDown className="w-3 h-3 text-red-600" /> };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Pick History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Loading your pick history...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Pick History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No picks submitted yet.</p>
            <p className="text-muted-foreground text-sm mt-2">
              Start making picks to see your history here!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Pick History
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your betting history across all weeks
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((pickSet) => (
            <div key={pickSet.id} className="border rounded-lg p-4">
              {/* Week Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{formatWeek(pickSet.weekId)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(pickSet.status)}>
                    {pickSet.status}
                  </Badge>
                  {pickSet.submittedAtUtc && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(pickSet.submittedAtUtc).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Picks */}
              <div className="space-y-2">
                {pickSet.picks?.map((pick) => {
                  const result = getPickResult(pick);
                  return (
                    <div key={pick.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded">
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <div className="font-medium">
                            {pick.game?.homeTeam} vs {pick.game?.awayTeam}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Picked: {getPickChoice(pick.choice, pick.game?.homeTeam || 'Home', pick.game?.awayTeam || 'Away')} ({pick.spreadAtPick > 0 ? '+' : ''}{pick.spreadAtPick})
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {pick.game?.completed && (
                          <div className="text-xs text-center">
                            <div className="font-medium">
                              {pick.game.homeScore}-{pick.game.awayScore}
                            </div>
                          </div>
                        )}
                        {result && (
                          <div className="flex items-center gap-1">
                            {result.icon}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }) || (
                  <div className="text-center text-muted-foreground py-2">
                    No picks in this set
                  </div>
                )}
              </div>

              {/* Tiebreaker */}
              {pickSet.tiebreakerScore && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    Tiebreaker: {pickSet.tiebreakerScore} points
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PickHistory;