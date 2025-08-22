import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { nflApi, Game, Team } from "@/services/nflApi";
import ApiKeyInput from "./ApiKeyInput";


const GameSelection = () => {
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);
  const maxGames = 3;

  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = localStorage.getItem('nfl_api_key');
      setHasApiKey(!!apiKey);
      if (apiKey) {
        loadGames();
      } else {
        setIsLoading(false);
      }
    };

    checkApiKey();
  }, []);

  const loadGames = async () => {
    setIsLoading(true);
    try {
      const gameData = await nflApi.getGames();
      setGames(gameData);
    } catch (error) {
      console.error('Error loading games:', error);
      // Fallback to mock data
      const fallbackGames = await nflApi.getGames();
      setGames(fallbackGames);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeySet = () => {
    setHasApiKey(true);
    loadGames();
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

  if (!hasApiKey) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 sm:space-y-4">
          <h2 className="text-xl sm:text-3xl font-display font-bold text-foreground">Week 1 Matchups</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-xs sm:text-base px-3">Connect your API to get real NFL data</p>
        </div>
        <ApiKeyInput onApiKeySet={handleApiKeySet} />
      </div>
    );
  }

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
              className={`cursor-pointer transition-smooth hover:shadow-hover border rounded-lg ${
                isSelected 
                  ? 'border-primary shadow-glow bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-card/50'
              }`}
              onClick={() => toggleGameSelection(game.id)}
            >
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  {/* Game Info */}
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <img 
                        src={game.awayTeam.logo} 
                        alt={`${game.awayTeam.name} logo`}
                        className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                        }}
                      />
                      <div className="text-left">
                        <div className="font-display font-semibold text-foreground text-xs sm:text-lg truncate">{game.awayTeam.name}</div>
                        <div className="text-xs font-medium text-muted-foreground">
                          {game.awayTeam.name === underdogTeam && `+${spreadValue}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-muted-foreground font-bold text-xs sm:text-lg">@</div>

                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <img 
                        src={game.homeTeam.logo} 
                        alt={`${game.homeTeam.name} logo`}
                        className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                        }}
                      />
                      <div className="text-left">
                        <div className="font-display font-semibold text-foreground text-xs sm:text-lg truncate">{game.homeTeam.name}</div>
                        <div className="text-xs font-medium text-muted-foreground">
                          {game.homeTeam.name === favoriteTeam && `-${spreadValue}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      Sun 1PM
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center shadow-glow">
                        <Check className="w-3 h-3 sm:w-5 sm:h-5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
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