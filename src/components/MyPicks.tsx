import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Calendar, Trash2, Edit, Loader2, CheckCircle2, XCircle, Minus } from "lucide-react";
import { usePicks } from "@/contexts/PicksContext";
import { useSport } from "@/hooks/use-sport";
import { oddsApi, OddsGame } from "@/services/oddsApi";
import { picksApi, PickSet } from "@/lib/api/picks";
import { useToast } from "@/hooks/use-toast";
import { getCurrentWeekIdSync } from "@/lib/utils/weekUtils";
import WeekSelector from "./WeekSelector";

interface MyPicksProps {
  onEditPicks?: () => void;
}

interface SavedPick {
  id: string;
  gameId: string;
  choice: 'home' | 'away';
  spreadAtPick: number;
}

const MyPicks = ({ onEditPicks }: MyPicksProps) => {
  const { clearPicks } = usePicks();
  const { selectedSport } = useSport();
  const { toast } = useToast();
  const [games, setGames] = useState<OddsGame[]>([]);
  const [savedPicks, setSavedPicks] = useState<PickSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string>(getCurrentWeekIdSync());
  const [pickHistory, setPickHistory] = useState<PickSet[]>([]);

  const getTeamLogo = (teamName: string) => {
    // Simple team name to abbreviation mapping for logos
    const teamLogos: Record<string, string> = {
      'Buffalo Bills': 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png',
      'Miami Dolphins': 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png',
      'New England Patriots': 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png',
      'New York Jets': 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png',
      'Baltimore Ravens': 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png',
      'Cincinnati Bengals': 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png',
      'Cleveland Browns': 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png',
      'Pittsburgh Steelers': 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png',
      'Houston Texans': 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png',
      'Indianapolis Colts': 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png',
      'Jacksonville Jaguars': 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png',
      'Tennessee Titans': 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png',
      'Denver Broncos': 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png',
      'Kansas City Chiefs': 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
      'Las Vegas Raiders': 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png',
      'Los Angeles Chargers': 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png',
      'Dallas Cowboys': 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png',
      'New York Giants': 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png',
      'Philadelphia Eagles': 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png',
      'Washington Commanders': 'https://a.espncdn.com/i/teamlogos/nfl/500/was.png',
      'Chicago Bears': 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png',
      'Detroit Lions': 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png',
      'Green Bay Packers': 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png',
      'Minnesota Vikings': 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png',
      'Atlanta Falcons': 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png',
      'Carolina Panthers': 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png',
      'New Orleans Saints': 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png',
      'Tampa Bay Buccaneers': 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png',
      'Arizona Cardinals': 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png',
      'Los Angeles Rams': 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png',
      'San Francisco 49ers': 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png',
      'Seattle Seahawks': 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png'
    };
    return teamLogos[teamName] || 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
  };

  useEffect(() => {
    loadData();
    loadPickHistory();
  }, [selectedSport]);

  useEffect(() => {
    loadWeekData(selectedWeek);
  }, [selectedWeek, selectedSport]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load games for current week (for editing)
      const gameData = await oddsApi.getUpcomingGames(true, selectedSport);
      setGames(gameData);
    } catch (error) {
      console.error('MyPicks: Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPickHistory = async () => {
    try {
      const history = await picksApi.getPickHistory(selectedSport);
      setPickHistory(history);
    } catch (error) {
      console.error('MyPicks: Error loading pick history:', error);
      setPickHistory([]);
    }
  };


  const loadWeekData = async (weekId: string) => {
    setIsLoading(true);
    try {
      const picks = await picksApi.getWeekPicks(weekId, selectedSport);
      setSavedPicks(picks);
    } catch (error) {
      console.error('MyPicks: Error loading week data:', error);
      setSavedPicks(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearPicks = async () => {
    if (!savedPicks) return;
    
    setIsDeleting(true);
    try {
      await picksApi.deletePicks(getCurrentWeekIdSync());
      
      // Clear local state
      setSavedPicks(null);
      clearPicks(); // Clear context picks too
      
      toast({
        title: "Picks Cleared",
        description: "Your picks have been successfully deleted.",
      });
      
    } catch (error) {
      console.error("MyPicks: Error clearing picks:", error);
      toast({
        title: "Error",
        description: "Failed to clear picks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getPickResult = (pick: any) => {
    // Use database status if available, otherwise fall back to calculation
    if (pick.status && pick.status !== 'pending') {
      switch (pick.status) {
        case 'won':
          return { status: 'won', icon: CheckCircle2, color: 'text-green-500' };
        case 'lost':
          return { status: 'lost', icon: XCircle, color: 'text-red-500' };
        case 'pushed':
          return { status: 'push', icon: Minus, color: 'text-yellow-500' };
        default:
          return { status: 'pending', icon: Minus, color: 'text-muted-foreground' };
      }
    }

    // Fallback: calculate based on game scores if no database status
    if (!pick.game?.completed || pick.game.homeScore === null || pick.game.awayScore === null) {
      return { status: 'pending', icon: Minus, color: 'text-muted-foreground' };
    }

    const homeWon = pick.game.homeScore > pick.game.awayScore;
    const awayWon = pick.game.awayScore > pick.game.homeScore;
    const tie = pick.game.homeScore === pick.game.awayScore;
    
    if (tie) {
      return { status: 'push', icon: Minus, color: 'text-yellow-500' };
    }

    const userPickedHome = pick.choice === 'home';
    const userWon = (userPickedHome && homeWon) || (!userPickedHome && awayWon);
    
    return userWon 
      ? { status: 'won', icon: CheckCircle2, color: 'text-green-500' }
      : { status: 'lost', icon: XCircle, color: 'text-red-500' };
  };

  const getPickedGames = () => {
    if (!savedPicks || !savedPicks.picks) {
      return [];
    }
    
    return savedPicks.picks.map(pick => ({
      ...pick,
      result: getPickResult(pick),
      game: pick.game || games.find(g => g.id === pick.gameId)
    })).filter(pick => pick.game);
  };

  const getWeekInfo = () => {
    const currentWeekId = getCurrentWeekIdSync();
    const isCurrentWeek = selectedWeek === currentWeekId;
    const weekNumber = selectedWeek.replace(/\D/g, '');
    
    // Only allow deletion if it's the current week, there are picks, and picks aren't locked
    const isLocked = savedPicks?.status === 'locked' || savedPicks?.lockedAtUtc != null;
    const hasPicks = savedPicks && savedPicks.picks && savedPicks.picks.length > 0;
    const canDelete = isCurrentWeek && hasPicks && !isLocked;
    
    return {
      weekNumber,
      isCurrentWeek,
      canEdit: isCurrentWeek,
      canDelete
    };
  };

  const pickedGames = getPickedGames();
  const weekInfo = getWeekInfo();

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">My Picks</h3>
          <p className="text-muted-foreground text-xs sm:text-base">Loading your picks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-foreground">
            My {weekInfo.isCurrentWeek ? 'Current ' : ''}Picks
          </h3>
          <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
              Week {weekInfo.weekNumber} - Against the Spread
              {!weekInfo.isCurrentWeek && (
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                  Historical
                </span>
              )}
            </p>
            {savedPicks && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {savedPicks.status === 'submitted' ? '✓ Saved' : savedPicks.status}
              </Badge>
            )}
          </div>
        </div>
        
        {weekInfo.canEdit && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onEditPicks}
            className="text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50 shadow-sm text-xs sm:text-sm"
          >
            <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Edit </span>Picks
          </Button>
        )}
      </div>

      {/* Week Navigation */}
      <div className="flex justify-center">
        <WeekSelector
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
          compact={true}
        />
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

      {/* No Picks State */}
      {pickedGames.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg sm:text-xl font-display font-bold text-foreground mb-2">
            {weekInfo.isCurrentWeek ? 'No Picks Yet' : 'No Picks for This Week'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {weekInfo.isCurrentWeek 
              ? 'Head over to the Fixtures tab to select your 3 games against the spread for this week.'
              : 'No picks were made for this week.'
            }
          </p>
        </div>
      )}

      {/* Picks Grid */}
      {pickedGames.length > 0 && (
        <div className="grid gap-3 sm:gap-6 max-w-4xl mx-auto">
          {pickedGames.map((pick, index) => {
            if (!pick.game) return null;
            
            const selectedTeam = pick.choice === 'home' ? pick.game.homeTeam : pick.game.awayTeam;
            const opponentTeam = pick.choice === 'home' ? pick.game.awayTeam : pick.game.homeTeam;
            
            const displaySpread = pick.spreadAtPick > 0 ? `+${pick.spreadAtPick}` : `${pick.spreadAtPick}`;
            const isPickingFavorite = pick.spreadAtPick < 0;
            
            const ResultIcon = pick.result.icon;

            return (
              <Card 
                key={pick.id}
                className={`group border-border/50 bg-gradient-to-br transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden ${
                  pick.result.status === 'won' ? 'from-green-50 via-card/95 to-green-100 border-green-200' :
                  pick.result.status === 'lost' ? 'from-red-50 via-card/95 to-red-100 border-red-200' :
                  pick.result.status === 'push' ? 'from-yellow-50 via-card/95 to-yellow-100 border-yellow-200' :
                  'from-card via-card/95 to-primary/5 hover:from-card hover:to-primary/10'
                }`}
              >
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-6">
                  {/* Picked Team Logo - Clean without background */}
                   <div className="flex-shrink-0 relative">
                     <img 
                       src={getTeamLogo(typeof selectedTeam === 'string' ? selectedTeam : selectedTeam.name)} 
                       alt={`${typeof selectedTeam === 'string' ? selectedTeam : selectedTeam.name} logo`}
                       className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png';
                      }}
                    />
                    {/* Result indicator overlay */}
                    {pick.result.status !== 'pending' && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border-2 flex items-center justify-center">
                        <ResultIcon className={`w-3 h-3 ${pick.result.color}`} />
                      </div>
                    )}
                  </div>
                  
                  {/* Game Info - Compact Typography */}
                  <div className="flex-1 min-w-0">
                     <div className="text-sm sm:text-base md:text-lg leading-tight">
                       <span className="font-bold text-foreground text-sm sm:text-lg">
                         {typeof selectedTeam === 'string' ? selectedTeam.split(' ').pop() : selectedTeam.code}
                       </span>
                       <span className="text-muted-foreground/70 mx-1 sm:mx-3 text-xs sm:text-sm">vs</span>
                       <span className="text-foreground text-sm sm:text-base">
                         {typeof opponentTeam === 'string' ? opponentTeam.split(' ').pop() : opponentTeam.code}
                       </span>
                     </div>
                    
                     {/* Game scores for completed games */}
                     {false && (
                       <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                         <span>Final: Game scores temporarily disabled</span>
                       </div>
                     )}
                    
                    <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-2">
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
                      
                      {pick.result.status !== 'pending' && (
                        <Badge variant={
                          pick.result.status === 'won' ? 'default' : 
                          pick.result.status === 'lost' ? 'destructive' : 'secondary'
                        } className="text-xs px-2 py-0.5">
                          {pick.result.status === 'won' ? '✓ Won' : 
                           pick.result.status === 'lost' ? '✗ Lost' : '– Push'}
                        </Badge>
                      )}
                      
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        {isPickingFavorite ? 'Favorite' : 'Underdog'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}

      {/* Clear All Button - Only for current week with picks that aren't locked */}
      {weekInfo.canDelete && (
        <div className="text-center pt-2 sm:pt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearPicks}
            disabled={isDeleting}
            className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 text-xs sm:text-sm disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            )}
            {isDeleting ? 'Clearing...' : 'Clear All Picks'}
          </Button>
        </div>
      )}

      {/* Week Summary for Historical Weeks */}
      {!weekInfo.isCurrentWeek && pickedGames.length > 0 && (
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold text-sm text-center mb-3">Week {weekInfo.weekNumber} Summary</h4>
          <div className="flex justify-center gap-6">
            {(() => {
              const wins = pickedGames.filter(p => p.result.status === 'won').length;
              const losses = pickedGames.filter(p => p.result.status === 'lost').length;
              const pushes = pickedGames.filter(p => p.result.status === 'push').length;
              const pending = pickedGames.filter(p => p.result.status === 'pending').length;
              
              return (
                <>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{wins}</div>
                    <div className="text-xs text-muted-foreground">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{losses}</div>
                    <div className="text-xs text-muted-foreground">Losses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">{pushes}</div>
                    <div className="text-xs text-muted-foreground">Pushes</div>
                  </div>
                  {pending > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-muted-foreground">{pending}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPicks;