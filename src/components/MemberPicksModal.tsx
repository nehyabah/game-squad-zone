import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy } from "lucide-react";
import { picksApi, type PickSet } from "@/lib/api/picks";
import { getCurrentWeekId } from "@/lib/utils/weekUtils";

interface MemberPicksModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  displayName: string;
}

export function MemberPicksModal({ isOpen, onClose, userId, displayName }: MemberPicksModalProps) {
  const [picks, setPicks] = useState<PickSet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserPicks();
    }
  }, [isOpen, userId]);

  const loadUserPicks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const weekId = getCurrentWeekId();
      const userPicks = await picksApi.getUserPicks(userId, weekId);
      setPicks(userPicks);
    } catch (err: any) {
      console.error('Error loading user picks:', err);
      setError('Failed to load picks');
    } finally {
      setIsLoading(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto sm:max-w-3xl max-w-[95vw]">
        <DialogHeader className="pb-2 sm:pb-2 pb-1">
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
              <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-bold text-sm sm:text-base">
              {displayName}'s Picks
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading picks...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : !picks || !picks.picks || picks.picks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No picks found for this week</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-6 p-2 sm:p-4 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-lg sm:rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Badge variant="outline" className="text-xs sm:text-sm font-medium border-primary/30">
                    📅 Week {picks.weekId.replace(/\D/g, '')}
                  </Badge>
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    🎯 {picks.picks.length} Picks
                  </Badge>
                </div>
                {picks.status && (
                  <Badge variant={picks.status === 'submitted' ? 'default' : 'secondary'} className="capitalize text-xs sm:text-sm w-fit">
                    {picks.status === 'submitted' ? '✅ Submitted' : picks.status}
                  </Badge>
                )}
              </div>

              <div className="space-y-2 sm:space-y-3">
                {picks.picks.map((pick) => {
                  if (!pick.game) return null;

                  const selectedTeam = pick.choice === 'home' ? pick.game.homeTeam : pick.game.awayTeam;
                  const isHomeSelected = pick.choice === 'home';

                  return (
                    <Card key={pick.id} className="overflow-hidden hover:shadow-lg transition-shadow border-primary/10">
                      <CardContent className="p-2 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-4 flex-1">
                            {/* Away Team */}
                            <div className={`flex items-center gap-1.5 sm:gap-3 flex-1 transition-all duration-200 ${!isHomeSelected ? 'font-semibold text-primary scale-105' : 'opacity-60'}`}>
                              <div className={`relative ${!isHomeSelected ? 'ring-2 ring-primary/20 rounded-full' : ''}`}>
                                <img
                                  src={getTeamLogo(pick.game.awayTeam)}
                                  alt={pick.game.awayTeam}
                                  className="w-7 h-7 sm:w-10 sm:h-10 rounded-full"
                                />
                                {!isHomeSelected && (
                                  <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full flex items-center justify-center">
                                    <Trophy className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="text-xs sm:text-sm font-medium block leading-tight">{pick.game.awayTeam}</span>
                                <span className="text-xs text-muted-foreground">Away</span>
                              </div>
                            </div>

                            <div className="text-center px-1 sm:px-2">
                              <div className="text-xs sm:text-sm font-semibold text-muted-foreground">VS</div>
                            </div>

                            {/* Home Team */}
                            <div className={`flex items-center gap-1.5 sm:gap-3 flex-1 justify-end transition-all duration-200 ${isHomeSelected ? 'font-semibold text-primary scale-105' : 'opacity-60'}`}>
                              <div>
                                <span className="text-xs sm:text-sm font-medium block text-right leading-tight">{pick.game.homeTeam}</span>
                                <span className="text-xs text-muted-foreground">Home</span>
                              </div>
                              <div className={`relative ${isHomeSelected ? 'ring-2 ring-primary/20 rounded-full' : ''}`}>
                                <img
                                  src={getTeamLogo(pick.game.homeTeam)}
                                  alt={pick.game.homeTeam}
                                  className="w-7 h-7 sm:w-10 sm:h-10 rounded-full"
                                />
                                {isHomeSelected && (
                                  <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full flex items-center justify-center">
                                    <Trophy className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-primary/10">
                          <div className="text-xs text-muted-foreground">
                            {formatGameTime(pick.game.startAtUtc)}
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Badge variant="outline" className="text-xs border-primary/20 px-1.5 py-0.5">
                              Spread: {pick.spreadAtPick > 0 ? '+' : ''}{pick.spreadAtPick}
                            </Badge>
                            <Badge variant="default" className="text-xs font-semibold bg-gradient-to-r from-primary to-primary/80 px-1.5 py-0.5">
                              ✓ {selectedTeam}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {picks.tiebreakerScore && (
                <Card className="mt-3 sm:mt-6 bg-gradient-to-r from-amber-50/50 to-yellow-50/30 border-amber-200/50">
                  <CardHeader className="pb-2 sm:pb-3 p-2 sm:p-6">
                    <CardTitle className="text-sm flex items-center gap-2">
                      🎲 Tiebreaker Prediction
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 p-2 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Total combined score prediction:
                      </span>
                      <Badge variant="secondary" className="text-sm sm:text-base font-bold px-2 sm:px-3 py-1 w-fit">
                        {picks.tiebreakerScore} pts
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}