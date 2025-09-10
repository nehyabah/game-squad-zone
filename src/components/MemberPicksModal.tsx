import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, CheckCircle2, XCircle, Minus, X } from "lucide-react";
import { picksApi, type PickSet } from "@/lib/api/picks";
import { getCurrentWeekIdSync } from "@/lib/utils/weekUtils";
import WeekSelector from "./WeekSelector";

interface MemberPicksModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  displayName: string;
}

export function MemberPicksModal({ isOpen, onClose, userId, displayName }: MemberPicksModalProps) {
  const [currentWeekPicks, setCurrentWeekPicks] = useState<PickSet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // Separate loading for week changes
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>(getCurrentWeekIdSync());
  const [cachedWeeks, setCachedWeeks] = useState<Map<string, PickSet | null>>(new Map()); // Cache data

  // Track if this is the initial load or a week change
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && userId && selectedWeek) {
      const isWeekChange = hasInitialized;
      loadWeekPicks(selectedWeek, isWeekChange);
      if (!hasInitialized) {
        setHasInitialized(true);
      }
    }
  }, [selectedWeek, isOpen, userId]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
      setCachedWeeks(new Map()); // Clear cache when modal closes
    }
  }, [isOpen]);

  const loadWeekPicks = async (weekId: string, isWeekChange = false) => {
    console.log('🔍 Loading picks for player:', { userId, displayName, weekId });
    
    // Check cache first
    if (cachedWeeks.has(weekId)) {
      const cachedData = cachedWeeks.get(weekId);
      setCurrentWeekPicks(cachedData);
      return; // Use cached data immediately, no loading needed
    }
    
    // Use different loading states for initial load vs week change
    if (isWeekChange) {
      setIsTransitioning(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      const picks = await picksApi.getUserPicks(userId, weekId);
      console.log('✅ API Response:', picks);
      console.log('📊 Picks data:', picks?.picks);
      if (picks?.picks && picks.picks.length > 0) {
        console.log('🎮 First pick detailed:', JSON.stringify(picks.picks[0], null, 2));
        console.log('🎮 First pick game data:', picks.picks[0]?.game);
      }
      
      // Cache the result
      setCachedWeeks(prev => new Map(prev).set(weekId, picks));
      setCurrentWeekPicks(picks);
    } catch (err: any) {
      console.error('❌ Error loading user picks for week:', err);
      const nullResult = null;
      
      // Cache null results too (for 404s)
      if (err.response?.status === 404) {
        setCachedWeeks(prev => new Map(prev).set(weekId, nullResult));
      }
      
      setCurrentWeekPicks(nullResult);
      if (err.response?.status !== 404) {
        setError('Failed to load picks for this week');
      }
    } finally {
      setIsLoading(false);
      setIsTransitioning(false);
    }
  };


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

  const formatGameTime = (startTime: string) => {
    return new Date(startTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getPickResult = (pick: any) => {
    // Use pre-calculated status from backend instead of manual calculation
    switch (pick.status) {
      case 'won':
        return { status: 'won', icon: CheckCircle2, color: 'text-green-500' };
      case 'lost':
        return { status: 'lost', icon: XCircle, color: 'text-red-500' };
      case 'pushed':
        return { status: 'push', icon: Minus, color: 'text-yellow-500' };
      case 'pending':
      default:
        return { status: 'pending', icon: Minus, color: 'text-muted-foreground' };
    }
  };

  const getWeekSummary = (picks: PickSet) => {
    if (!picks.picks || picks.picks.length === 0) {
      return { wins: 0, losses: 0, pushes: 0 };
    }

    // Use pre-calculated status from backend directly
    return picks.picks.reduce((acc, pick) => {
      if (pick.status === 'won') acc.wins++;
      else if (pick.status === 'lost') acc.losses++;
      else if (pick.status === 'pushed') acc.pushes++;
      return acc;
    }, { wins: 0, losses: 0, pushes: 0 });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden p-0 gap-0 border-0 shadow-2xl bg-gradient-to-br from-background/95 via-background/98 to-background/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl w-[95vw] sm:w-auto">
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-5 border-b border-border/10 bg-gradient-to-r from-violet-50/60 via-purple-50/40 to-violet-50/60 backdrop-blur-sm sticky top-0 z-10 rounded-t-2xl sm:rounded-t-3xl">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-200/40 to-orange-200/60 blur-lg rounded-xl"></div>
                <div className="relative p-1.5 sm:p-2.5 bg-gradient-to-br from-amber-100/60 to-orange-100/80 rounded-lg sm:rounded-xl border border-amber-200/30">
                  <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-amber-600 drop-shadow-sm" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-clip-text text-transparent font-bold text-lg sm:text-xl tracking-tight">
                  {displayName}'s Picks
                </span>
              </div>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full hover:bg-slate-100/80 transition-colors"
            >
              <X className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          {/* Week Selector */}
          <div className="border-b border-border/10 px-3 py-2 sm:px-6 sm:py-4 bg-gradient-to-r from-emerald-50/30 via-teal-50/20 to-emerald-50/30 flex justify-center">
            <WeekSelector
              selectedWeek={selectedWeek}
              onWeekChange={setSelectedWeek}
              compact={true}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent via-muted/5 to-transparent">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
                <div className="relative mb-3 sm:mb-4">
                  <div className="absolute inset-0 bg-violet-200/40 blur-xl rounded-full"></div>
                  <Loader2 className="relative w-6 h-6 sm:w-8 sm:h-8 animate-spin text-violet-500" />
                </div>
                <span className="text-sm sm:text-base font-medium text-foreground/80">Loading picks...</span>
                <span className="text-xs sm:text-sm text-muted-foreground mt-1">Fetching weekly performance</span>
              </div>
            ) : (
              <div className="relative">
                {/* Subtle loading overlay for week transitions */}
                {isTransitioning && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-2 bg-background/90 px-3 py-2 rounded-full shadow-lg border">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                      <span className="text-sm font-medium text-foreground">Loading week...</span>
                    </div>
                  </div>
                )}
                
                {error ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
                    <div className="p-2 sm:p-3 bg-red-500/10 rounded-full mb-3 sm:mb-4">
                      <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                    </div>
                    <p className="text-red-500 font-medium text-sm sm:text-base">{error}</p>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">Unable to load picks data</p>
                  </div>
                ) : !currentWeekPicks ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
                    <div className="p-2 sm:p-3 bg-muted/20 rounded-full mb-3 sm:mb-4">
                      <Minus className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium text-sm sm:text-base">No picks for this week</p>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">Player hasn't made any picks yet</p>
                  </div>
                ) : (
              <>
                <div className="p-3 sm:p-6 border-b border-border/10 bg-gradient-to-r from-rose-50/40 via-pink-50/30 to-rose-50/40">
                  <div className="flex items-center justify-center gap-3">
                    <Badge variant="outline" className="text-xs font-semibold border-indigo-200/60 bg-indigo-50/60 text-indigo-700 px-3 py-1.5 rounded-full">
                      Week {selectedWeek.replace(/\D/g, '')}
                    </Badge>
                    {(() => {
                      const summary = getWeekSummary(currentWeekPicks);
                      return (
                        <Badge variant="outline" className="text-xs font-medium border-slate-200/60 bg-slate-50/60 text-slate-700 px-3 py-1.5 rounded-full">
                          {summary.wins}W {summary.losses}L {summary.pushes}D
                        </Badge>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-3 sm:p-6 space-y-2 sm:space-y-4">
                  {currentWeekPicks.picks?.map((pick) => {
                    if (!pick.game) return null;

                    const selectedTeam = pick.choice === 'home' ? pick.game.homeTeam : pick.game.awayTeam;
                    const isHomeSelected = pick.choice === 'home';
                    const result = getPickResult(pick);
                    const ResultIcon = result.icon;

                    return (
                      <div key={pick.id} className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm ${
                        result.status === 'won' ? 'bg-gradient-to-r from-green-50/80 via-green-50/60 to-green-50/80 border-green-200/60 shadow-green-100/50' : 
                        result.status === 'lost' ? 'bg-gradient-to-r from-red-50/80 via-red-50/60 to-red-50/80 border-red-200/60 shadow-red-100/50' :
                        result.status === 'push' ? 'bg-gradient-to-r from-yellow-50/80 via-yellow-50/60 to-yellow-50/80 border-yellow-200/60 shadow-yellow-100/50' : 'bg-gradient-to-r from-muted/30 via-background/80 to-muted/30 border-border/40'
                      } ${result.status !== 'pending' ? 'shadow-sm' : ''}`}>
                        <div className="flex items-center justify-between">
                          {/* Picked Team & Matchup */}
                          <div className="flex items-center gap-2 sm:gap-3 flex-1">
                            <div className="relative">
                              <img
                                src={getTeamLogo(selectedTeam)}
                                alt={selectedTeam}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-emerald-200/40 shadow-lg"
                              />
                              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-background shadow-sm"></div>
                            </div>
                            
                            <div className="flex flex-col flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm sm:text-base font-bold text-foreground">
                                  {selectedTeam.split(' ').pop()}
                                </span>
                                <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                                  vs {(isHomeSelected ? pick.game.awayTeam : pick.game.homeTeam).split(' ').pop()}
                                </span>
                              </div>
                              
                              {pick.game.completed && (
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs sm:text-sm text-muted-foreground font-mono">
                                    Final: {isHomeSelected 
                                      ? `${pick.game.homeScore}-${pick.game.awayScore}` 
                                      : `${pick.game.awayScore}-${pick.game.homeScore}`
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Pick Result */}
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-background/60 rounded-full border border-border/40">
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {pick.spreadAtPick > 0 ? '+' : ''}{pick.spreadAtPick}
                              </span>
                            </div>
                            <div className="relative">
                              <div className={`absolute inset-0 ${result.color.replace('text-', 'bg-').replace('-500', '-200')} blur-lg rounded-full opacity-30`}></div>
                              <ResultIcon className={`relative w-5 h-5 sm:w-6 sm:h-6 ${result.color} drop-shadow-sm`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {currentWeekPicks.tiebreakerScore && (
                  <div className="mx-3 sm:mx-6 mb-3 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-amber-50/60 via-amber-50/40 to-amber-50/60 border border-amber-200/40 rounded-xl sm:rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-amber-100 to-amber-200/80 rounded-lg sm:rounded-xl">
                          <span className="text-base sm:text-lg">🎲</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm font-semibold text-foreground">Tiebreaker</span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Final score prediction</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs sm:text-sm font-bold px-2.5 py-1 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-0 shadow-sm">
                        {currentWeekPicks.tiebreakerScore} pts
                      </Badge>
                    </div>
                  </div>
                )}
                </>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}