import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Calendar, Trash2 } from "lucide-react";
import { usePicks } from "@/contexts/PicksContext";
import { nflApi, Game } from "@/services/nflApi";

const MyPicks = () => {
  const { selectedPicks, clearPicks } = usePicks();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setIsLoading(true);
    try {
      const gameData = await nflApi.getGames(2023, 1);
      setGames(gameData);
    } catch (error) {
      console.error('MyPicks: Error loading games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPickedGames = () => {
    return Array.from(selectedPicks.entries()).map(([gameId, team]) => {
      const game = games.find(g => g.id === gameId);
      return { gameId, team, game };
    }).filter(pick => pick.game);
  };

  const pickedGames = getPickedGames();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">My Current Picks</h3>
          <p className="text-muted-foreground text-xs sm:text-base">Loading your picks...</p>
        </div>
      </div>
    );
  }

  if (pickedGames.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">No Picks Yet</h3>
          <p className="text-muted-foreground text-xs sm:text-base max-w-md mx-auto px-3">
            Head over to the Fixtures tab to select your 3 games against the spread for this week.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2 sm:space-y-4">
        <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">My Current Picks</h3>
        <p className="text-muted-foreground text-xs sm:text-base">Week 1 - Against the Spread</p>
        <div className="flex items-center justify-center gap-2 flex-wrap px-3">
          <Badge variant="default" className="text-xs px-2 py-0.5">
            {pickedGames.length}/3 selected
          </Badge>
          <Badge variant="outline" className="text-muted-foreground text-xs px-2 py-0.5">
            <Calendar className="w-2 h-2 mr-1" />
            <span className="hidden sm:inline">Lock: </span>Sat 12PM EST
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {pickedGames.map(({ gameId, team, game }) => {
          if (!game) return null;
          
          const selectedTeam = team === 'home' ? game.homeTeam : game.awayTeam;
          const spreadValue = Math.abs(game.spread);
          const isPickingFavorite = (game.spread < 0 && team === 'home') || (game.spread > 0 && team === 'away');
          const displaySpread = isPickingFavorite ? `-${spreadValue}` : `+${spreadValue}`;

          return (
            <Card 
              key={gameId}
              className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent relative overflow-hidden"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  {/* Game Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-3">
                      <img 
                        src={game.awayTeam.logo} 
                        alt={`${game.awayTeam.name} logo`}
                        className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                        }}
                      />
                      <div className="text-center">
                        <div className="font-medium text-foreground text-xs sm:text-sm">
                          {game.awayTeam.code}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-muted-foreground text-xs font-medium">@</div>
                    
                    <div className="flex items-center gap-3">
                      <img 
                        src={game.homeTeam.logo} 
                        alt={`${game.homeTeam.name} logo`}
                        className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                        }}
                      />
                      <div className="text-center">
                        <div className="font-medium text-foreground text-xs sm:text-sm">
                          {game.homeTeam.code}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pick Display */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold text-primary text-sm sm:text-base">
                        {selectedTeam.code}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {displaySpread}
                      </div>
                    </div>
                    <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                      <Target className="w-3 h-3 mr-1" />
                      Pick
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {pickedGames.length > 0 && (
        <div className="text-center pt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearPicks}
            className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Picks
          </Button>
        </div>
      )}
    </div>
  );
};

export default MyPicks;