import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Trophy,
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  answersAPI,
  roundsAPI,
  SixNationsUserAnswer,
  SixNationsRound,
  SixNationsMatch,
} from "@/lib/api/six-nations";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { TeamFlag } from "@/lib/utils/sixNations";

// StatCard Component
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  bgColorClass: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  colorClass,
  bgColorClass,
}) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md">
    <div className={`p-3 rounded-xl ${bgColorClass} ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

// MatchCard Component
interface MatchCardProps {
  match: SixNationsMatch;
  answers: SixNationsUserAnswer[];
}

const MatchCard: React.FC<MatchCardProps> = ({ match, answers }) => {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md mb-2 sm:mb-3">
      {/* Match Header - Ultra Compact */}
      <div className="bg-slate-50 px-2.5 py-2 sm:px-4 sm:py-2.5 border-b border-slate-200">
        <div className="flex items-center justify-between gap-2">
          {/* Teams */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
            <TeamFlag
              teamName={match.homeTeam}
              className="text-sm sm:text-lg flex-shrink-0"
            />
            <span className="text-[11px] sm:text-sm font-bold text-slate-900 truncate">
              {match.homeTeam}
            </span>
            <span className="text-slate-400 font-medium text-[9px] sm:text-xs px-0.5">
              vs
            </span>
            <TeamFlag
              teamName={match.awayTeam}
              className="text-sm sm:text-lg flex-shrink-0"
            />
            <span className="text-[11px] sm:text-sm font-bold text-slate-900 truncate">
              {match.awayTeam}
            </span>
          </div>

          {/* Score or Status */}
          {match.completed ? (
            <div className="bg-white px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded border border-slate-300 flex items-center gap-1 flex-shrink-0">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 uppercase">
                FT
              </span>
              <span className="text-xs sm:text-base font-black text-slate-900">
                {match.homeScore}-{match.awayScore}
              </span>
            </div>
          ) : (
            <div className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold flex items-center gap-0.5 flex-shrink-0">
              <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
              Up
            </div>
          )}
        </div>

        {/* Match Details */}
        <div className="flex items-center gap-1.5 mt-1 text-slate-500">
          <span className="flex items-center gap-0.5 text-[8px] sm:text-[10px]">
            <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            {new Date(match.matchDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
          {match.venue && (
            <span className="flex items-center gap-0.5 text-[8px] sm:text-[10px] truncate">
              <MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              <span className="truncate max-w-[90px] sm:max-w-none">
                {match.venue}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Picks Section - Ultra Compact */}
      <div className="p-1.5 sm:p-3 space-y-1 sm:space-y-1.5">
        {answers.map((answer) => (
          <div
            key={answer.id}
            className={cn(
              "p-1.5 sm:p-2.5 rounded-md sm:rounded-lg transition-all border",
              answer.isCorrect === true &&
                "bg-emerald-50/70 border-emerald-200",
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
                    {answer.question?.questionText}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-0.5">
                    <span className="text-[7px] sm:text-[8px] text-slate-400 font-medium">
                      Pick:
                    </span>
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
                      <span className="text-[7px] sm:text-[8px] text-slate-400 font-medium">
                        Res:
                      </span>
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
        ))}
      </div>
    </div>
  );
};

// Main Component
export default function MySixNationsPicks() {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<SixNationsUserAnswer[]>([]);
  const [rounds, setRounds] = useState<SixNationsRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRound) {
      loadRoundAnswers(selectedRound);
    }
  }, [selectedRound]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all rounds
      const roundsData = await roundsAPI.getAll();
      setRounds(roundsData);

      // Find active round and select it by default
      const activeRound = roundsData.find((r) => r.isActive);
      if (activeRound) {
        setSelectedRound(activeRound.id);
      } else if (roundsData.length > 0) {
        setSelectedRound(roundsData[0].id);
      }

      // Load answers for active round
      if (activeRound) {
        const answersData = await answersAPI.getUserAnswers();
        setAnswers(answersData);
      }
    } catch (error) {
      console.error("Error loading Six Nations picks:", error);
      toast({
        title: "Error",
        description: "Failed to load your picks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoundAnswers = async (roundId: string) => {
    try {
      const answersData = await answersAPI.getUserAnswers(roundId);
      setAnswers(answersData);
    } catch (error) {
      console.error("Error loading round answers:", error);
    }
  };

  // Group answers by match
  const answersByMatch = answers.reduce((acc, answer) => {
    if (!answer.question?.match) return acc;

    const matchId = answer.question.match.id;
    if (!acc[matchId]) {
      acc[matchId] = {
        match: answer.question.match as SixNationsMatch,
        answers: [],
      };
    }
    acc[matchId].answers.push(answer);
    return acc;
  }, {} as Record<string, { match: SixNationsMatch; answers: SixNationsUserAnswer[] }>);

  // Calculate stats
  const totalAnswers = answers.length;
  const correctAnswers = answers.filter((a) => a.isCorrect === true).length;
  const wrongAnswers = answers.filter((a) => a.isCorrect === false).length;
  const pendingAnswers = answers.filter((a) => a.isCorrect === null).length;
  const totalPoints = answers.reduce((sum, a) => {
    if (a.isCorrect === true && a.question) {
      return sum + a.question.points;
    }
    return sum;
  }, 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
        <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-primary" />
        <p className="text-xs sm:text-sm text-muted-foreground font-medium animate-pulse">
          Loading Your Picks...
        </p>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 text-center">
          <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mb-2 sm:mb-3" />
          <h3 className="text-sm sm:text-base font-semibold mb-1">
            No Rounds Available
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Six Nations rounds will appear here when they are created.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedRoundData = rounds.find((r) => r.id === selectedRound);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header - Ultra Compact */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              My Six Nations Picks
            </h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              Your predictions and scores
            </p>
          </div>

          {/* Stats Summary - Compact Pills */}
          {totalAnswers > 0 && (
            <div className="flex gap-1">
              <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[10px] sm:text-xs font-bold">
                  {correctAnswers}
                </span>
              </div>
              <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                <XCircle className="w-3 h-3" />
                <span className="text-[10px] sm:text-xs font-bold">
                  {wrongAnswers}
                </span>
              </div>
              {pendingAnswers > 0 && (
                <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] sm:text-xs font-bold">
                    {pendingAnswers}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Round Selector - Arrow Navigation */}
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
              {selectedRoundData?.name}
            </span>
            {selectedRoundData?.isActive && (
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

      {/* Total Points Card - Compact */}
      {totalAnswers > 0 && (
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg sm:rounded-xl p-4 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Trophy className="w-5 h-5 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  Points
                </p>
                <p className="text-2xl sm:text-2xl font-black text-primary">
                  {totalPoints}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] sm:text-[10px] text-muted-foreground font-medium">
                {selectedRoundData?.name || "This Round"}
              </p>
              <p className="text-base sm:text-base font-bold text-slate-900">
                {correctAnswers}/{totalAnswers}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Picks by Match */}
      {Object.keys(answersByMatch).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 text-center">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mb-2 sm:mb-3" />
            <h3 className="text-sm sm:text-base font-semibold mb-1">
              No Picks Yet
            </h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              You haven't made any predictions for{" "}
              {selectedRoundData?.name || "this round"} yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {Object.values(answersByMatch)
            .sort((a, b) => a.match.matchNumber - b.match.matchNumber)
            .map(({ match, answers: matchAnswers }) => (
              <MatchCard key={match.id} match={match} answers={matchAnswers} />
            ))}
        </div>
      )}
    </div>
  );
}
