import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, CheckCircle2, XCircle, Minus, X, Lock, Clock, MapPin, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { picksApi, type PickSet } from "@/lib/api/picks";
import { getCurrentWeekIdSync } from "@/lib/utils/weekUtils";
import WeekSelector from "./WeekSelector";
import { roundsAPI, answersAPI, type SixNationsRound, type SixNationsUserAnswer, type SixNationsMatch } from "@/lib/api/six-nations";
import { cn } from "@/lib/utils";
import { TeamFlag } from "@/lib/utils/sixNations";

interface MemberPicksModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  displayName: string;
  sport?: string;
}

export function MemberPicksModal({ isOpen, onClose, userId, displayName, sport = 'nfl' }: MemberPicksModalProps) {
  // NFL state
  const [currentWeekPicks, setCurrentWeekPicks] = useState<PickSet | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>(getCurrentWeekIdSync());
  const [cachedWeeks, setCachedWeeks] = useState<Map<string, PickSet | null>>(new Map());

  // Six Nations state
  const [rounds, setRounds] = useState<SixNationsRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [sixNationsAnswers, setSixNationsAnswers] = useState<SixNationsUserAnswer[]>([]);
  const [cachedRounds, setCachedRounds] = useState<Map<string, SixNationsUserAnswer[]>>(new Map());

  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());

  const isSixNations = sport === 'six-nations';

  const toggleMatchCollapse = (matchId: string) => {
    setExpandedMatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(matchId)) {
        newSet.delete(matchId);
      } else {
        newSet.add(matchId);
      }
      return newSet;
    });
  };

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      if (isSixNations) {
        loadSixNationsRounds();
      } else {
        const isWeekChange = hasInitialized;
        loadWeekPicks(selectedWeek, isWeekChange);
        if (!hasInitialized) {
          setHasInitialized(true);
        }
      }
    }
  }, [isOpen, userId, sport]);

  // Load data when selection changes (week or round)
  useEffect(() => {
    if (isOpen && userId) {
      if (isSixNations && selectedRound) {
        console.log('🔄 Loading round answers:', { selectedRound, userId });
        const isRoundChange = hasInitialized;
        loadRoundAnswers(selectedRound, isRoundChange);
        if (!hasInitialized) {
          setHasInitialized(true);
        }
      } else if (!isSixNations && selectedWeek) {
        console.log('🔄 Loading week picks:', { selectedWeek, userId });
        const isWeekChange = hasInitialized;
        loadWeekPicks(selectedWeek, isWeekChange);
      }
    }
  }, [selectedWeek, selectedRound, isOpen, userId, isSixNations]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
      setCachedWeeks(new Map());
      setCachedRounds(new Map());
      setExpandedMatches(new Set());
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
      const picks = await picksApi.getUserPicks(userId, weekId, sport);
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

  const loadSixNationsRounds = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const roundsData = await roundsAPI.getAll();
      setRounds(roundsData);

      // Find active round and select it by default
      const activeRound = roundsData.find((r) => r.isActive);
      if (activeRound) {
        setSelectedRound(activeRound.id);
      } else if (roundsData.length > 0) {
        setSelectedRound(roundsData[0].id);
      }
    } catch (err: any) {
      console.error('❌ Error loading Six Nations rounds:', err);
      setError('Failed to load rounds');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoundAnswers = async (roundId: string, isRoundChange = false) => {
    console.log('🔍 Loading Six Nations answers for player:', { userId, displayName, roundId });

    // Check cache first
    if (cachedRounds.has(roundId)) {
      const cachedData = cachedRounds.get(roundId);
      setSixNationsAnswers(cachedData || []);
      return;
    }

    // Use different loading states for initial load vs round change
    if (isRoundChange) {
      setIsTransitioning(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const answers = await answersAPI.getSpecificUserAnswers(userId, roundId);
      console.log('✅ Six Nations API Response:', answers);
      console.log('📊 Number of answers:', answers.length);
      if (answers.length > 0) {
        console.log('🎮 First answer:', answers[0]);
        console.log('🎮 Has question?:', !!answers[0].question);
      }

      // Cache the result
      setCachedRounds(prev => new Map(prev).set(roundId, answers));
      setSixNationsAnswers(answers);
    } catch (err: any) {
      console.error('❌ Error loading user answers for round:', err);
      const emptyResult: SixNationsUserAnswer[] = [];

      // Cache empty results too (for 404s)
      if (err.response?.status === 404) {
        setCachedRounds(prev => new Map(prev).set(roundId, emptyResult));
      }

      setSixNationsAnswers(emptyResult);
      if (err.response?.status !== 404) {
        setError('Failed to load answers for this round');
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
          {/* Week/Round Selector */}
          <div className="border-b border-border/10 py-2 sm:py-4 bg-gradient-to-r from-emerald-50/30 via-teal-50/20 to-emerald-50/30">
            {isSixNations ? (
              <div className="px-3 sm:px-6">
                <div className="flex items-center justify-between gap-2 bg-secondary/30 rounded-lg px-3 py-2">
                  <button
                    onClick={() => {
                      const currentIndex = rounds.findIndex((r) => r.id === selectedRound);
                      if (currentIndex > 0) {
                        setSelectedRound(rounds[currentIndex - 1].id);
                      }
                    }}
                    disabled={rounds.findIndex((r) => r.id === selectedRound) === 0}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      rounds.findIndex((r) => r.id === selectedRound) === 0
                        ? "text-muted-foreground/30 cursor-not-allowed"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2 flex-1 justify-center">
                    <span className="text-sm font-bold text-foreground">
                      {rounds.find((r) => r.id === selectedRound)?.name}
                    </span>
                    {rounds.find((r) => r.id === selectedRound)?.isActive && (
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </div>

                  <button
                    onClick={() => {
                      const currentIndex = rounds.findIndex((r) => r.id === selectedRound);
                      if (currentIndex < rounds.length - 1) {
                        setSelectedRound(rounds[currentIndex + 1].id);
                      }
                    }}
                    disabled={rounds.findIndex((r) => r.id === selectedRound) === rounds.length - 1}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      rounds.findIndex((r) => r.id === selectedRound) === rounds.length - 1
                        ? "text-muted-foreground/30 cursor-not-allowed"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <WeekSelector
                selectedWeek={selectedWeek}
                onWeekChange={setSelectedWeek}
                compact={true}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-transparent via-muted/5 to-transparent" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            {console.log('🎨 Render state:', {
              isSixNations,
              isLoading,
              isTransitioning,
              error,
              sixNationsAnswersCount: sixNationsAnswers.length,
              currentWeekPicksExists: !!currentWeekPicks,
              selectedRound,
              selectedWeek
            })}
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
                      <span className="text-sm font-medium text-foreground">
                        Loading {isSixNations ? 'round' : 'week'}...
                      </span>
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
                ) : (isSixNations && sixNationsAnswers.length === 0) || (!isSixNations && !currentWeekPicks) ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
                    <div className="p-2 sm:p-3 bg-muted/20 rounded-full mb-3 sm:mb-4">
                      <Minus className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium text-sm sm:text-base">
                      No {isSixNations ? 'answers' : 'picks'} for this {isSixNations ? 'round' : 'week'}
                    </p>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                      Player hasn't made any {isSixNations ? 'predictions' : 'picks'} yet
                    </p>
                  </div>
                ) : (
              <>
                <div className="p-3 sm:p-6 border-b border-border/10 bg-gradient-to-r from-rose-50/40 via-pink-50/30 to-rose-50/40">
                  <div className="flex items-center justify-center gap-3">
                    <Badge variant="outline" className="text-xs font-semibold border-indigo-200/60 bg-indigo-50/60 text-indigo-700 px-3 py-1.5 rounded-full">
                      {isSixNations
                        ? rounds.find(r => r.id === selectedRound)?.name || 'Round'
                        : `Week ${selectedWeek.replace(/\D/g, '')}`
                      }
                    </Badge>
                    {(() => {
                      if (isSixNations) {
                        const correct = sixNationsAnswers.filter(a => a.isCorrect === true).length;
                        const incorrect = sixNationsAnswers.filter(a => a.isCorrect === false).length;
                        const pending = sixNationsAnswers.filter(a => a.isCorrect === null).length;
                        return (
                          <Badge variant="outline" className="text-xs font-medium border-slate-200/60 bg-slate-50/60 text-slate-700 px-3 py-1.5 rounded-full">
                            {correct}C {incorrect}I {pending}P
                          </Badge>
                        );
                      } else {
                        const summary = getWeekSummary(currentWeekPicks!);
                        return (
                          <Badge variant="outline" className="text-xs font-medium border-slate-200/60 bg-slate-50/60 text-slate-700 px-3 py-1.5 rounded-full">
                            {summary.wins}W {summary.losses}L {summary.pushes}D
                          </Badge>
                        );
                      }
                    })()}
                  </div>
                </div>

                <div className="p-3 sm:p-6 pb-6 sm:pb-8 space-y-2 sm:space-y-4">
                  {isSixNations ? (
                    // Six Nations Answers - grouped by match
                    (() => {
                      // Group answers by match
                      const answersByMatch = sixNationsAnswers.reduce((acc, answer) => {
                        if (!answer.question?.match) return acc;

                        const matchId = answer.question.match.id;
                        if (!acc[matchId]) {
                          acc[matchId] = {
                            match: answer.question.match as SixNationsMatch,
                            answers: []
                          };
                        }
                        acc[matchId].answers.push(answer);
                        return acc;
                      }, {} as Record<string, { match: SixNationsMatch; answers: SixNationsUserAnswer[] }>);

                      return Object.values(answersByMatch)
                        .sort((a, b) => a.match.matchNumber - b.match.matchNumber)
                        .map(({ match, answers: matchAnswers }) => {
                          const isExpanded = expandedMatches.has(match.id);
                          const correctCount = matchAnswers.filter(a => a.isCorrect === true).length;
                          const incorrectCount = matchAnswers.filter(a => a.isCorrect === false).length;
                          const pendingCount = matchAnswers.filter(a => a.isCorrect === null).length;

                          return (
                          <div key={match.id} className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            {/* Match Header - Clickable */}
                            <div
                              className={cn(
                                "bg-slate-50 px-2.5 py-2 sm:px-4 sm:py-2.5 cursor-pointer hover:bg-slate-100 transition-colors",
                                isExpanded && "border-b border-slate-200"
                              )}
                              onClick={() => toggleMatchCollapse(match.id)}
                            >
                              <div className="flex items-center justify-between gap-2">
                                {/* Teams */}
                                <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
                                  <TeamFlag teamName={match.homeTeam} className="text-sm sm:text-lg flex-shrink-0" />
                                  <span className="text-[11px] sm:text-sm font-bold text-slate-900 truncate">
                                    {match.homeTeam}
                                  </span>
                                  <span className="text-slate-400 font-medium text-[9px] sm:text-xs px-0.5">vs</span>
                                  <TeamFlag teamName={match.awayTeam} className="text-sm sm:text-lg flex-shrink-0" />
                                  <span className="text-[11px] sm:text-sm font-bold text-slate-900 truncate">
                                    {match.awayTeam}
                                  </span>
                                </div>

                                {/* Score or Status */}
                                <div className="flex items-center gap-2">
                                  {/* Compact summary when collapsed */}
                                  {!isExpanded && (
                                    <div className="flex items-center gap-1.5">
                                      {correctCount > 0 && (
                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                                          <CheckCircle2 className="w-2.5 h-2.5" />
                                          {correctCount}
                                        </div>
                                      )}
                                      {incorrectCount > 0 && (
                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-bold">
                                          <XCircle className="w-2.5 h-2.5" />
                                          {incorrectCount}
                                        </div>
                                      )}
                                      {pendingCount > 0 && (
                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">
                                          <Clock className="w-2.5 h-2.5" />
                                          {pendingCount}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {(() => {
                                    const matchTime = new Date(match.matchDate);
                                    const now = new Date();
                                    const twoHoursAfterStart = new Date(matchTime.getTime() + 2 * 60 * 60 * 1000);

                                    if (match.completed) {
                                      return (
                                        <div className="bg-white px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded border border-slate-300 flex items-center gap-1 flex-shrink-0">
                                          <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 uppercase">FT</span>
                                          <span className="text-xs sm:text-base font-black text-slate-900">
                                            {match.homeScore}-{match.awayScore}
                                          </span>
                                        </div>
                                      );
                                    } else if (now >= twoHoursAfterStart) {
                                      // More than 2 hours after start - show nothing
                                      return null;
                                    } else if (now >= matchTime) {
                                      // Started but less than 2 hours ago - show Live
                                      return (
                                        <div className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold flex items-center gap-0.5 flex-shrink-0">
                                          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                          Live
                                        </div>
                                      );
                                    } else {
                                      // Not started yet - show Upcoming
                                      return (
                                        <div className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold flex items-center gap-0.5 flex-shrink-0">
                                          <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                                          Upcoming
                                        </div>
                                      );
                                    }
                                  })()}
                                  {/* Chevron indicator */}
                                  <ChevronDown
                                    className={cn(
                                      "w-4 h-4 text-slate-400 transition-transform",
                                      !isExpanded && "rotate-180"
                                    )}
                                  />
                                </div>
                              </div>

                              {/* Match Details - Only show when expanded */}
                              {isExpanded && (
                                <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                                  <span className="flex items-center gap-0.5 text-[8px] sm:text-[10px]">
                                    <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                    {new Date(match.matchDate).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short"
                                    })}
                                  </span>
                                  {match.venue && (
                                    <span className="flex items-center gap-0.5 text-[8px] sm:text-[10px] truncate">
                                      <MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                      <span className="truncate max-w-[90px] sm:max-w-none">{match.venue}</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Answers Section - Only show when expanded */}
                            {isExpanded && (
                            <div className="p-1.5 sm:p-3 space-y-1 sm:space-y-1.5">
                              {matchAnswers.map((answer) => {
                                const isHidden = answer.answer === null;

                                if (isHidden) {
                                  return (
                                    <div key={answer.id} className="p-1.5 sm:p-2.5 rounded-md sm:rounded-lg border border-slate-300 bg-slate-50/70">
                                      <div className="flex items-center justify-center py-3 gap-2">
                                        <Lock className="w-4 h-4 text-muted-foreground" />
                                        <div className="flex flex-col">
                                          <span className="text-xs text-muted-foreground font-medium">
                                            Answer hidden until match starts
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={answer.id}
                                    className={cn(
                                      "p-1.5 sm:p-2.5 rounded-md sm:rounded-lg transition-all border",
                                      answer.isCorrect === true && "bg-emerald-50/70 border-emerald-200",
                                      answer.isCorrect === false && "bg-rose-50/70 border-rose-200",
                                      answer.isCorrect === null && "bg-slate-50/70 border-slate-200"
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-1.5">
                                      {/* Question & Answer */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1 mb-0.5">
                                          <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                            Q{answer.question?.questionNumber}
                                          </span>
                                          <p className="text-[9px] sm:text-[11px] font-semibold text-slate-700 leading-tight truncate">
                                            {answer.question?.questionText || answer.question?.text}
                                          </p>
                                        </div>

                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                          <div className="flex items-center gap-0.5">
                                            <span className="text-[7px] sm:text-[8px] text-slate-400 font-medium">Pick:</span>
                                            <span
                                              className={cn(
                                                "text-[9px] sm:text-[11px] font-bold truncate max-w-[70px] sm:max-w-none",
                                                answer.isCorrect === true && "text-emerald-700",
                                                answer.isCorrect === false && "text-rose-700",
                                                answer.isCorrect === null && "text-slate-700"
                                              )}
                                            >
                                              {answer.answer}
                                            </span>
                                          </div>

                                          {answer.question?.correctAnswer && (
                                            <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5">
                                              <span className="text-[7px] sm:text-[8px] text-slate-400 font-medium">Res:</span>
                                              <span className="text-[9px] sm:text-[11px] font-bold text-slate-900 truncate max-w-[70px] sm:max-w-none">
                                                {answer.question.correctAnswer}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Status Badge */}
                                      <div className="flex-shrink-0">
                                        {answer.isCorrect === true && (
                                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[8px] sm:text-[9px] font-bold">
                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                            <span>{answer.question?.points}</span>
                                          </div>
                                        )}
                                        {answer.isCorrect === false && (
                                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[8px] sm:text-[9px] font-bold">
                                            <XCircle className="w-2.5 h-2.5" />
                                          </div>
                                        )}
                                        {answer.isCorrect === null && (
                                          <div className="flex items-center px-1.5 py-0.5 rounded-full bg-slate-300 text-slate-600 text-[8px] sm:text-[9px] font-bold">
                                            <Clock className="w-2.5 h-2.5" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            )}
                          </div>
                          );
                        });
                    })()
                  ) : (
                    // NFL Picks
                    currentWeekPicks!.picks?.map((pick) => {
                    if (!pick.game) return null;

                    const selectedTeam = pick.choice === 'home' ? pick.game.homeTeam : pick.game.awayTeam;
                    const isHomeSelected = pick.choice === 'home';
                    const displaySpread = pick.spreadAtPick === 0 ? 'EVEN' :
                      pick.spreadAtPick > 0 ? `+${pick.spreadAtPick}` : `${pick.spreadAtPick}`;
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
                                {displaySpread}
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
                  })
                  )}
                </div>

                {!isSixNations && currentWeekPicks?.tiebreakerScore && (
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
