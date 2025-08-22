import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { nflApi, Game, Team } from "@/services/nflApi";
import { usePicks } from "@/contexts/PicksContext";
import confetti from "canvas-confetti";


const GameSelection = () => {
  const { selectedPicks, setSelectedPicks } = usePicks();
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

    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']
    });

    toast({
      title: "🎉 Picks submitted!",
      description: "Your picks have been locked in for this week. View them in My Picks!",
      duration: 4000,
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
              className="group cursor-pointer transition-all duration-300 ease-out transform hover:scale-[1.02] border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-elegant hover:bg-gradient-to-br hover:from-card hover:via-card/95 hover:to-primary/20 relative overflow-hidden"
            >
              <CardContent className="p-3 sm:p-4 relative overflow-hidden">
                {/* Main content */}
                <div className="relative flex flex-col items-center gap-2">
                  {/* Teams Layout - Logo Centered */}
                  <div className="flex items-center justify-center gap-4 sm:gap-8 w-full">
                    {/* Away Team */}
                    <div className="flex flex-col items-center gap-1">
                      <img 
                        src={game.awayTeam.logo} 
                        alt={`${game.awayTeam.name} logo`}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                        }}
                      />
                      <div className="text-center">
                        <div className="font-medium text-foreground text-[10px] sm:text-xs">
                          {game.awayTeam.code}
                        </div>
                        <div className="text-muted-foreground text-[8px] sm:text-[10px] leading-tight">
                          {game.awayTeam.name}
                        </div>
                      </div>
                    </div>

                    {/* VS Separator */}
                    <div className="text-muted-foreground/60 text-xs font-medium">
                      vs
                    </div>

                    {/* Home Team */}
                    <div className="flex flex-col items-center gap-1">
                      <img 
                        src={game.homeTeam.logo} 
                        alt={`${game.homeTeam.name} logo`}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                        }}
                      />
                      <div className="text-center">
                        <div className="font-medium text-foreground text-[10px] sm:text-xs">
                          {game.homeTeam.code}
                        </div>
                        <div className="text-muted-foreground text-[8px] sm:text-[10px] leading-tight">
                          {game.homeTeam.name}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spread Selection Buttons */}
                  <div className="flex items-center gap-2 mt-1">
                    {game.spread < 0 ? (
                      <>
                        <button
                          onClick={() => handleSpreadPick(game.id, 'away')}
                          className={`px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base font-semibold transition-all duration-200 hover:scale-105 min-w-[50px] sm:min-w-[60px] ${
                            selectedPick === 'away' 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          +{spreadValue}
                        </button>
                        <button
                          onClick={() => handleSpreadPick(game.id, 'home')}
                          className={`px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base font-semibold transition-all duration-200 hover:scale-105 min-w-[50px] sm:min-w-[60px] ${
                            selectedPick === 'home' 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          -{spreadValue}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSpreadPick(game.id, 'away')}
                          className={`px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base font-semibold transition-all duration-200 hover:scale-105 min-w-[50px] sm:min-w-[60px] ${
                            selectedPick === 'away' 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          -{spreadValue}
                        </button>
                        <button
                          onClick={() => handleSpreadPick(game.id, 'home')}
                          className={`px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base font-semibold transition-all duration-200 hover:scale-105 min-w-[50px] sm:min-w-[60px] ${
                            selectedPick === 'home' 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          +{spreadValue}
                        </button>
                      </>
                    )}
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
            variant="default"
            size="sm"
            onClick={submitPicks}
            className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 px-6 py-2 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
            <div className="relative flex items-center gap-1.5">
              {selectedPicks.size === maxGames && <Sparkles className="w-3.5 h-3.5" />}
              <span className="text-sm font-medium">
                {selectedPicks.size === maxGames ? 'Submit Picks' : `Select ${maxGames - selectedPicks.size} More`}
              </span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameSelection;