import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { nflApi, Game, Team } from "@/services/nflApi";


const GameSelection = () => {
  const [selectedPicks, setSelectedPicks] = useState<Map<string, 'home' | 'away'>>(new Map());
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

  const handleSpreadPick = (gameId: string, team: 'home' | 'away') => {
    const newPicks = new Map(selectedPicks);
    
    if (newPicks.has(gameId)) {
      newPicks.delete(gameId);
    } else if (newPicks.size < maxGames) {
      newPicks.set(gameId, team);
    } else {
      toast({
        title: "Maximum games selected",
        description: "You can only select 3 games per week",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedPicks(newPicks);
  };

  const submitPicks = () => {
    if (selectedPicks.size < 3) {
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
          <Badge variant={selectedPicks.size === maxGames ? "default" : "secondary"} className="text-xs px-2 py-0.5">
            {selectedPicks.size}/{maxGames} picked
          </Badge>
          <Badge variant="outline" className="text-muted-foreground text-xs px-2 py-0.5">
            <Clock className="w-2 h-2 mr-1" />
            <span className="hidden sm:inline">Lock: </span>Sat 12PM EST
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {games.map((game) => {
          const selectedPick = selectedPicks.get(game.id);
          const favoriteTeam = game.spread < 0 ? game.homeTeam.name : game.awayTeam.name;
          const underdogTeam = game.spread < 0 ? game.awayTeam.name : game.homeTeam.name;
          const spreadValue = Math.abs(game.spread);

          return (
            <Card 
              key={game.id}
              className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-border/50 bg-gradient-to-br from-card to-card/80 hover:from-primary/5 hover:via-accent/5 hover:to-card/90 backdrop-blur-sm"
            >
              <CardContent className="p-3 sm:p-4 relative overflow-hidden">
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-accent/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Main content */}
                <div className="relative flex items-center justify-between gap-3 sm:gap-4">
                  {/* Away Team */}
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <img 
                      src={game.awayTeam.logo} 
                      alt={`${game.awayTeam.name} logo`}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md group-hover:drop-shadow-lg transition-all duration-300"
                      onError={(e) => {
                        e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                      }}
                    />
                    <div className="text-center">
                      <div className="font-medium text-foreground text-xs">
                        {game.awayTeam.code}
                      </div>
                    </div>
                  </div>

                  {/* VS Separator with spread buttons */}
                  <div className="flex flex-col items-center gap-2 px-2">
                    <div className="text-muted-foreground font-bold text-sm opacity-40">VS</div>
                    
                    {/* Spread Selection Buttons */}
                    <div className="flex items-center gap-1">
                      {game.spread < 0 ? (
                        <>
                          <Button
                            variant={selectedPick === 'away' ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSpreadPick(game.id, 'away')}
                            className="min-w-12 h-7 text-xs px-2"
                          >
                            +{spreadValue}
                          </Button>
                          <Button
                            variant={selectedPick === 'home' ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSpreadPick(game.id, 'home')}
                            className="min-w-12 h-7 text-xs px-2"
                          >
                            -{spreadValue}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant={selectedPick === 'away' ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSpreadPick(game.id, 'away')}
                            className="min-w-12 h-7 text-xs px-2"
                          >
                            -{spreadValue}
                          </Button>
                          <Button
                            variant={selectedPick === 'home' ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSpreadPick(game.id, 'home')}
                            className="min-w-12 h-7 text-xs px-2"
                          >
                            +{spreadValue}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Home Team */}
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <img 
                      src={game.homeTeam.logo} 
                      alt={`${game.homeTeam.name} logo`}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md group-hover:drop-shadow-lg transition-all duration-300"
                      onError={(e) => {
                        e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                      }}
                    />
                    <div className="text-center">
                      <div className="font-medium text-foreground text-xs">
                        {game.homeTeam.code}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Game time */}
                <div className="relative flex items-center justify-center mt-2 pt-2 border-t border-border/20">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">Sun 1PM</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedPicks.size > 0 && (
        <div className="text-center">
          <Button 
            variant="squad" 
            size="lg"
            onClick={submitPicks}
            className="min-w-48"
          >
            {selectedPicks.size === maxGames ? 'Submit Picks' : `Select ${maxGames - selectedPicks.size} More`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameSelection;