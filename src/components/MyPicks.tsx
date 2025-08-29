import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Calendar, Trash2, Edit } from "lucide-react";
import { usePicks } from "@/contexts/PicksContext";
import { nflApi, Game } from "@/services/nflApi";
import PastPicks from "./PastPicks";

interface MyPicksProps {
  onEditPicks?: () => void;
}

const MyPicks = ({ onEditPicks }: MyPicksProps) => {
  const { selectedPicks, clearPicks } = usePicks();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setIsLoading(true);
    try {
<<<<<<< HEAD
      const gameData = await nflApi.getGames(2023, 1);
=======
      const gameData = await nflApi.getGames(2023);
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
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
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-foreground">My Current Picks</h3>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1">Week 1 - Against the Spread</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onEditPicks}
          className="text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50 shadow-sm text-xs sm:text-sm"
        >
          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Edit </span>Picks
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 py-2 sm:py-4 px-3 sm:px-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg sm:rounded-xl border border-primary/20">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">
            {pickedGames.length}/3 selected
          </Badge>
        </div>
        <div className="hidden sm:block w-px h-4 sm:h-6 bg-border"></div>
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Lock: </span><span className="sm:hidden">Lock:</span>
          <span className="hidden sm:inline">Saturday 12PM EST</span><span className="sm:hidden">Sat 12PM</span>
        </div>
      </div>

      {/* Picks Grid */}
      <div className="grid gap-3 sm:gap-6 max-w-4xl mx-auto">
        {pickedGames.map(({ gameId, team, game }, index) => {
          if (!game) return null;
          
          const selectedTeam = team === 'home' ? game.homeTeam : game.awayTeam;
          const opponentTeam = team === 'home' ? game.awayTeam : game.homeTeam;
          const spreadValue = Math.abs(game.spread);
          const isPickingFavorite = (game.spread < 0 && team === 'home') || (game.spread > 0 && team === 'away');
          const displaySpread = isPickingFavorite ? `-${spreadValue}` : `+${spreadValue}`;

          return (
            <Card 
              key={gameId}
              className="group border-border/50 bg-gradient-to-br from-card via-card/95 to-primary/5 hover:from-card hover:to-primary/10 transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden"
            >
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-6">
                  {/* Picked Team Logo - Clean without background */}
                  <div className="flex-shrink-0">
                    <img 
                      src={selectedTeam.logo} 
                      alt={`${selectedTeam.name} logo`}
                      className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                      }}
                    />
                  </div>
                  
                  {/* Game Info - Compact Typography */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base md:text-lg leading-tight">
                      <span className="font-bold text-foreground text-sm sm:text-lg">{selectedTeam.name}</span>
                      <span className="text-muted-foreground/70 mx-1 sm:mx-3 text-xs sm:text-sm">vs</span>
                      <span className="text-foreground text-sm sm:text-base">{opponentTeam.name}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-3">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Spread</span>
                        <Badge variant="outline" className={`text-xs font-bold px-1 sm:px-2 ${
                          isPickingFavorite 
                            ? 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' 
                            : 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                        }`}>
                          {displaySpread}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        {isPickingFavorite ? 'Favorite' : 'Underdog'}
                      </div>
                    </div>
                  </div>

                  {/* Confidence Indicator - Hidden on mobile */}
                  <div className="hidden md:flex flex-col items-center">
                    <div className="w-2 h-6 sm:h-8 bg-gradient-to-t from-primary/20 to-primary rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Clear All Button */}
      {pickedGames.length > 0 && (
        <div className="text-center pt-2 sm:pt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearPicks}
            className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 text-xs sm:text-sm"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Clear All Picks
          </Button>
        </div>
      )}

      {/* Past Picks Section */}
      <div className="mt-8 sm:mt-12">
        <PastPicks />
      </div>
    </div>
  );
};

export default MyPicks;