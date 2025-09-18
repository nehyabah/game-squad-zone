import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp, Target } from "lucide-react";
import { oddsApi, OddsGame } from "@/services/oddsApi";
import { picksApi } from "@/lib/api/picks";

const UpcomingGames = () => {
  const [games, setGames] = useState<OddsGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekInfo, setWeekInfo] = useState({ weekNumber: 1, start: '', end: '' });
  const [selectedPicks, setSelectedPicks] = useState<Map<string, 'home' | 'away'>>(new Map());

  useEffect(() => {
    loadGamesAndPicks();
  }, []);

  const loadGamesAndPicks = async () => {
    setIsLoading(true);
    try {
      // Get week info for display
      const weekData = oddsApi.getWeekDateRangeForDisplay();
      setWeekInfo(weekData);
      
      // Get games for current week only
      const gameData = await oddsApi.getUpcomingGames(true);
      setGames(gameData.slice(0, 8)); // Show first 8 games
      
      // Load existing picks for current week
      const weekId = `2025-W${weekData.weekNumber}`;
      const picks = await picksApi.getWeekPicks(weekId);
      
      // If picks exist, populate the selected picks
      if (picks && picks.picks) {
        const pickMap = new Map<string, 'home' | 'away'>();
        picks.picks.forEach(pick => {
          pickMap.set(pick.gameId, pick.choice);
        });
        setSelectedPicks(pickMap);
      }
    } catch (error) {
      console.error("Error loading games and picks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSpread = (spread: number, isHome: boolean) => {
    if (spread === 0) return "EVEN";
    
    const adjustedSpread = isHome ? spread : -spread;
    const sign = adjustedSpread > 0 ? "+" : "";
    return `${sign}${adjustedSpread}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming NFL Games & Spreads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Loading upcoming games...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          NFL Week {weekInfo.weekNumber} Games & Spreads
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {weekInfo.start && weekInfo.end ? `${weekInfo.start} - ${weekInfo.end} • ` : ''}Real-time odds from multiple sportsbooks
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {games.map((game) => {
            const selectedPick = selectedPicks.get(game.id);
            const hasSelectedPick = selectedPick !== undefined;
            
            return (
              <div
                key={game.id}
                className={`border rounded-lg p-4 transition-colors relative ${
                  hasSelectedPick 
                    ? 'border-primary/60 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm' 
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {/* Selected pick indicator */}
                {hasSelectedPick && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="default" className="text-xs px-2 py-1 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      My Pick
                    </Badge>
                  </div>
                )}
                {/* Header with time */}
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {game.time}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Spread
                  </Badge>
                </div>

                {/* Teams */}
                <div className="space-y-3">
                  {/* Away Team */}
                  <div className={`flex items-center justify-between p-2 rounded ${
                    selectedPick === 'away' ? 'bg-primary/15 border border-primary/30' : ''
                  }`}>
                    <div className="flex items-center gap-3">
                      <img
                        src={game.awayTeam.logo}
                        alt={`${game.awayTeam.name} logo`}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png";
                        }}
                      />
                      <div>
                        <div className={`font-medium text-sm ${
                          selectedPick === 'away' ? 'text-primary font-bold' : ''
                        }`}>{game.awayTeam.code}</div>
                        <div className="text-xs text-muted-foreground">
                          @ {game.homeTeam.code}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-sm font-medium ${
                        selectedPick === 'away' ? 'text-primary font-bold' : ''
                      }`}>
                        {formatSpread(game.spread, false)}
                      </div>
                    </div>
                  </div>

                  {/* Home Team */}
                  <div className={`flex items-center justify-between p-2 rounded ${
                    selectedPick === 'home' ? 'bg-primary/15 border border-primary/30' : ''
                  }`}>
                    <div className="flex items-center gap-3">
                      <img
                        src={game.homeTeam.logo}
                        alt={`${game.homeTeam.name} logo`}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png";
                        }}
                      />
                      <div>
                        <div className={`font-medium text-sm ${
                          selectedPick === 'home' ? 'text-primary font-bold' : ''
                        }`}>{game.homeTeam.code}</div>
                        <div className="text-xs text-muted-foreground">
                          vs {game.awayTeam.code}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-sm font-medium ${
                        selectedPick === 'home' ? 'text-primary font-bold' : ''
                      }`}>
                        {formatSpread(game.spread, true)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {games.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No upcoming games available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingGames;