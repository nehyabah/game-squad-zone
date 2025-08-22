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
              className="group transition-all duration-300 border-border/50 bg-gradient-to-br from-card via-card/90 to-card/50 backdrop-blur-sm"
            >
              <CardContent className="p-4 sm:p-6 relative overflow-hidden">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/2 to-accent/3 opacity-50" />
                
                {/* Main content */}
                <div className="relative flex flex-col items-center gap-4 sm:gap-6">
                  {/* Teams Layout - Logo Centered */}
                  <div className="flex items-center justify-center gap-6 sm:gap-12 w-full">
                    {/* Away Team */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <img 
                          src={game.awayTeam.logo} 
                          alt={`${game.awayTeam.name} logo`}
                          className="w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-xl"
                          onError={(e) => {
                            e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                          }}
                        />
                      </div>
                      <div className="text-center space-y-1">
                        <div className="font-medium text-foreground text-xs tracking-wide">
                          {game.awayTeam.code}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          {game.awayTeam.name}
                        </div>
                      </div>
                    </div>

                    {/* VS Separator */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-muted-foreground font-bold text-lg sm:text-2xl opacity-40">VS</div>
                      <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                    </div>

                    {/* Home Team */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <img 
                          src={game.homeTeam.logo} 
                          alt={`${game.homeTeam.name} logo`}
                          className="w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-xl"
                          onError={(e) => {
                            e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                          }}
                        />
                      </div>
                      <div className="text-center space-y-1">
                        <div className="font-medium text-foreground text-xs tracking-wide">
                          {game.homeTeam.code}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          {game.homeTeam.name}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spread Selection Buttons */}
                  <div className="flex items-center gap-3 mt-2">
                    {game.spread < 0 ? (
                      <>
                        <Button
                          variant={selectedPick === 'away' ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSpreadPick(game.id, 'away')}
                          className="min-w-16 text-xs"
                        >
                          +{spreadValue}
                        </Button>
                        <span className="text-muted-foreground text-xs">|</span>
                        <Button
                          variant={selectedPick === 'home' ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSpreadPick(game.id, 'home')}
                          className="min-w-16 text-xs"
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
                          className="min-w-16 text-xs"
                        >
                          -{spreadValue}
                        </Button>
                        <span className="text-muted-foreground text-xs">|</span>
                        <Button
                          variant={selectedPick === 'home' ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSpreadPick(game.id, 'home')}
                          className="min-w-16 text-xs"
                        >
                          +{spreadValue}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Minimal Footer */}
                <div className="relative flex items-center justify-center mt-4 pt-3 border-t border-border/20">
                  <div className="flex items-center gap-2 text-muted-foreground">
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