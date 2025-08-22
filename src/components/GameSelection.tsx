import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { nflApi, Game, Team } from "@/services/nflApi";


const GameSelection = () => {
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const maxGames = 3;

  useEffect(() => {
    // API key is now hardcoded, so just load games directly
    loadGames();
  }, []);

  const loadGames = async () => {
    setIsLoading(true);
    console.log('GameSelection: Loading games...');
    try {
      const gameData = await nflApi.getGames(2023, 1);
      console.log('GameSelection: Received games:', gameData);
      setGames(gameData);
    } catch (error) {
      console.error('GameSelection: Error loading games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGameSelection = (gameId: string) => {
    const newSelected = new Set(selectedGames);
    
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId);
    } else if (newSelected.size < maxGames) {
      newSelected.add(gameId);
    } else {
      toast({
        title: "Maximum games selected",
        description: "You can only select 3 games per week",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedGames(newSelected);
  };

  const submitPicks = () => {
    if (selectedGames.size < 3) {
      toast({
        title: "Select 3 games",
        description: "You must select exactly 3 games to submit your picks",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Picks submitted!",
      description: "Your picks have been locked in for this week",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 sm:space-y-4">
          <h2 className="text-xl sm:text-3xl font-display font-bold text-foreground">Week 1 Matchups</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-xs sm:text-base px-3">Loading games...</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-muted rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded"></div>
                      <div className="h-3 w-16 bg-muted rounded"></div>
                    </div>
                    <div className="h-4 w-4 bg-muted rounded"></div>
                    <div className="w-12 h-12 bg-muted rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded"></div>
                      <div className="h-3 w-16 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2 sm:space-y-4">
        <h2 className="text-xl sm:text-3xl font-display font-bold text-foreground">Week 1 Matchups</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-xs sm:text-base px-3">Select 3 games against the spread</p>
        <div className="flex items-center justify-center gap-2 flex-wrap px-3">
          <Badge variant={selectedGames.size === maxGames ? "default" : "secondary"} className="text-xs px-2 py-0.5">
            {selectedGames.size}/{maxGames} picked
          </Badge>
          <Badge variant="outline" className="text-muted-foreground text-xs px-2 py-0.5">
            <Clock className="w-2 h-2 mr-1" />
            <span className="hidden sm:inline">Lock: </span>Sat 12PM EST
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {games.map((game) => {
          const isSelected = selectedGames.has(game.id);
          const favoriteTeam = game.spread < 0 ? game.homeTeam.name : game.awayTeam.name;
          const underdogTeam = game.spread < 0 ? game.awayTeam.name : game.homeTeam.name;
          const spreadValue = Math.abs(game.spread);

          return (
            <Card 
              key={game.id}
              className={`group cursor-pointer transition-all duration-300 ease-out transform hover:scale-[1.02] ${
                isSelected 
                  ? 'border-primary/40 shadow-glow bg-gradient-to-br from-primary/8 via-primary/4 to-transparent ring-1 ring-primary/20' 
                  : 'border-border/50 bg-gradient-to-br from-card via-card/90 to-card/50 hover:border-primary/30 hover:shadow-elegant hover:bg-gradient-to-br hover:from-card hover:via-card/95 hover:to-primary/5'
              } backdrop-blur-sm`}
              onClick={() => toggleGameSelection(game.id)}
            >
              <CardContent className="p-4 sm:p-8 relative overflow-hidden">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/2 to-accent/3 opacity-50" />
                
                {/* Main content */}
                <div className="relative flex flex-col items-center gap-4 sm:gap-6">
                  {/* Teams Layout - Logo Centered */}
                  <div className="flex items-center justify-center gap-6 sm:gap-12 w-full">
                    {/* Away Team */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative group-hover:scale-110 transition-transform duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-110"></div>
                        <img 
                          src={game.awayTeam.logo} 
                          alt={`${game.awayTeam.name} logo`}
                          className="relative w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-xl"
                          onError={(e) => {
                            e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-foreground text-xs tracking-wide">
                          {game.awayTeam.code}
                        </div>
                        {game.awayTeam.name === underdogTeam && (
                          <div className="mt-1 px-2 py-0.5 bg-green-500/10 text-green-600 text-xs font-semibold rounded-full border border-green-500/20">
                            +{spreadValue}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* VS Separator */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-muted-foreground font-bold text-lg sm:text-2xl opacity-40">VS</div>
                      <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                    </div>

                    {/* Home Team */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative group-hover:scale-110 transition-transform duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-110"></div>
                        <img 
                          src={game.homeTeam.logo} 
                          alt={`${game.homeTeam.name} logo`}
                          className="relative w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-xl"
                          onError={(e) => {
                            e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-foreground text-xs tracking-wide">
                          {game.homeTeam.code}
                        </div>
                        {game.homeTeam.name === favoriteTeam && (
                          <div className="mt-1 px-2 py-0.5 bg-red-500/10 text-red-600 text-xs font-semibold rounded-full border border-red-500/20">
                            -{spreadValue}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Minimal Footer */}
                <div className="relative flex items-center justify-between mt-4 pt-3 border-t border-border/20">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">Sun 1PM</span>
                  </div>
                  
                  {/* Selection Status */}
                  {isSelected && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 text-primary rounded-full border border-primary/30">
                      <Check className="w-3 h-3" />
                      <span className="text-xs font-medium">Picked</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedGames.size > 0 && (
        <div className="text-center">
          <Button 
            variant="squad" 
            size="lg"
            onClick={submitPicks}
            className="min-w-48"
          >
            {selectedGames.size === maxGames ? 'Submit Picks' : `Select ${maxGames - selectedGames.size} More`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameSelection;