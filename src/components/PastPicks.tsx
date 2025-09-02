import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface WeeklyPick {
  gameId: string;
  team: 'home' | 'away';
  result?: 'win' | 'loss' | 'push';
  homeTeam: { name: string; code: string; logo: string };
  awayTeam: { name: string; code: string; logo: string };
  spread: number;
}

interface WeekData {
  week: number;
  record: { wins: number; losses: number };
  status: 'win' | 'loss' | 'push';
  picks: WeeklyPick[];
}

// No hardcoded past weeks - will load from API in the future
const mockPastWeeks: WeekData[] = [];

const PastPicks = () => {
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set());

  const toggleWeek = (week: number) => {
    const newOpenWeeks = new Set(openWeeks);
    if (newOpenWeeks.has(week)) {
      newOpenWeeks.delete(week);
    } else {
      newOpenWeeks.add(week);
    }
    setOpenWeeks(newOpenWeeks);
  };

  const getStatusColor = (status: 'win' | 'loss' | 'push') => {
    switch (status) {
      case 'win': return 'text-green-600 dark:text-green-400';
      case 'loss': return 'text-red-600 dark:text-red-400';
      case 'push': return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getResultBadgeColor = (result: 'win' | 'loss' | 'push') => {
    switch (result) {
      case 'win': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'loss': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'push': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
    }
  };

  if (mockPastWeeks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <h3 className="text-lg sm:text-xl font-display font-semibold text-foreground mb-2">No Past Picks</h3>
          <p className="text-muted-foreground text-sm">Your pick history will appear here after completing your first week.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="mb-6">
        <h3 className="text-lg sm:text-xl font-display font-bold text-foreground mb-1">Past Picks</h3>
        <p className="text-muted-foreground text-sm">Your pick history by week</p>
      </div>

      <div className="space-y-3">
        {mockPastWeeks.map((weekData) => {
          const isOpen = openWeeks.has(weekData.week);
          
          return (
            <Card key={weekData.week} className="border-border/50 bg-card/80 backdrop-blur-sm">
              <Collapsible open={isOpen} onOpenChange={() => toggleWeek(weekData.week)}>
                <CollapsibleTrigger asChild>
                  <div className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="font-semibold text-foreground">
                          Week {weekData.week}
                        </span>
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {weekData.record.wins}-{weekData.record.losses}
                      </Badge>
                      
                      <span className={`text-sm font-medium capitalize ${getStatusColor(weekData.status)}`}>
                        {weekData.status}
                      </span>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-border/50">
                    <div className="grid gap-3 mt-4">
                      {weekData.picks.map((pick) => {
                        const selectedTeam = pick.team === 'home' ? pick.homeTeam : pick.awayTeam;
                        const opponentTeam = pick.team === 'home' ? pick.awayTeam : pick.homeTeam;
                        const spreadValue = Math.abs(pick.spread);
                        const isPickingFavorite = (pick.spread < 0 && pick.team === 'home') || (pick.spread > 0 && pick.team === 'away');
                        const displaySpread = isPickingFavorite ? `-${spreadValue}` : `+${spreadValue}`;

                        return (
                          <div key={pick.gameId} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                            {/* Team Logo */}
                            <img 
                              src={selectedTeam.logo} 
                              alt={`${selectedTeam.name} logo`}
                              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                              onError={(e) => {
                                e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                              }}
                            />
                            
                            {/* Game Info */}
                            <div className="flex-1">
                              <div className="text-sm">
                                <span className="font-medium text-foreground">{selectedTeam.name}</span>
                                <span className="text-muted-foreground mx-2">vs</span>
                                <span className="text-foreground">{opponentTeam.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Spread: {displaySpread}
                              </div>
                            </div>
                            
                            {/* Result Badge */}
                            {pick.result && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs font-medium ${getResultBadgeColor(pick.result)}`}
                              >
                                {pick.result.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PastPicks;