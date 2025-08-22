import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  spread: number;
  time: string;
  homeLogo: string;
  awayLogo: string;
}

const mockGames: Game[] = [
  {
    id: "1",
    homeTeam: "Patriots",
    awayTeam: "Buccaneers", 
    spread: -3.5,
    time: "Sunday, Sep 10, 1:00 PM ET",
    homeLogo: "🏈",
    awayLogo: "🏈"
  },
  {
    id: "2", 
    homeTeam: "Panthers",
    awayTeam: "Falcons",
    spread: 2.5,
    time: "Sunday, Sep 10, 1:00 PM ET",
    homeLogo: "🏈",
    awayLogo: "🏈"
  },
  {
    id: "3",
    homeTeam: "Browns", 
    awayTeam: "Bengals",
    spread: 5.5,
    time: "Sunday, Sep 10, 1:00 PM ET",
    homeLogo: "🏈",
    awayLogo: "🏈"
  },
  {
    id: "4",
    homeTeam: "Lions",
    awayTeam: "Chiefs", 
    spread: -3.5,
    time: "Sunday, Sep 10, 1:00 PM ET",
    homeLogo: "🏈",
    awayLogo: "🏈"
  }
];

const GameSelection = () => {
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const maxGames = 3;

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Week 1 Matchups</h2>
        <p className="text-muted-foreground">Select 3 games against the spread. Picks lock at kickoff.</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Badge variant={selectedGames.size === maxGames ? "default" : "secondary"}>
            {selectedGames.size}/{maxGames} games selected
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Picks lock in: Saturday 12:00 PM EST
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {mockGames.map((game) => {
          const isSelected = selectedGames.has(game.id);
          const favoriteTeam = game.spread < 0 ? game.homeTeam : game.awayTeam;
          const underdogTeam = game.spread < 0 ? game.awayTeam : game.homeTeam;
          const spreadValue = Math.abs(game.spread);

          return (
            <Card 
              key={game.id}
              className={`cursor-pointer transition-smooth hover:shadow-hover border-2 ${
                isSelected ? 'border-primary shadow-glow bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => toggleGameSelection(game.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Game Info */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{game.awayLogo}</div>
                      <div>
                        <div className="font-semibold text-foreground">{game.awayTeam}</div>
                        <div className="text-sm text-muted-foreground">
                          {game.awayTeam === underdogTeam && `+${spreadValue}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-muted-foreground">vs</div>

                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{game.homeLogo}</div>
                      <div>
                        <div className="font-semibold text-foreground">{game.homeTeam}</div>
                        <div className="text-sm text-muted-foreground">
                          {game.homeTeam === favoriteTeam && `-${spreadValue}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Time & Selection */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{game.time}</div>
                    </div>
                    
                    {isSelected && (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary-foreground" />
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