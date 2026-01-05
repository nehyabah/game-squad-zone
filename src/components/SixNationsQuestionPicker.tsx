import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Circle,
  Loader2,
  ChevronDown,
  Calendar,
  MapPin,
  Trophy,
  Shield,
  Lock,
  Clock,
} from "lucide-react";
import { TeamFlag } from "@/lib/utils/sixNations";
import { questionsAPI, matchesAPI, answersAPI } from "@/lib/api/six-nations";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

// --- Types ---

interface Match {
  id: string;
  roundId: string;
  roundName: string;
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  venue?: string;
  homeScore?: number;
  awayScore?: number;
  completed: boolean;
  round?: {
    id: string;
    name: string;
    roundNumber: number;
    isActive: boolean;
  };
}

interface Question {
  id: string;
  matchId: string;
  questionNumber: number;
  questionText: string;
  questionType: "multiple_choice" | "yes_no";
  options?: string[];
  points: number;
  correctAnswer?: string;
}

interface UserAnswer {
  questionId: string;
  answer: string;
}

// Helper function to check if a match is locked (within 1 hour of kickoff)
const isMatchLocked = (matchDate: string): boolean => {
  const now = new Date();
  const kickoffTime = new Date(matchDate);
  const oneHourBeforeKickoff = new Date(kickoffTime.getTime() - 60 * 60 * 1000);
  return now >= oneHourBeforeKickoff;
};

// Helper function to calculate time remaining until lock (1 hour before kickoff)
const getTimeUntilLock = (
  matchDate: string
): {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isLocked: boolean;
} => {
  const now = new Date();
  const kickoffTime = new Date(matchDate);
  const lockTime = new Date(kickoffTime.getTime() - 60 * 60 * 1000); // 1 hour before kickoff

  const diffMs = lockTime.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isLocked: true,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, totalSeconds, isLocked: false };
};

// Format time remaining as a string
const formatTimeUntilLock = (matchDate: string): string => {
  const time = getTimeUntilLock(matchDate);

  if (time.isLocked) {
    return "Locked";
  }

  // If more than 24 hours, show days
  if (time.hours >= 24) {
    const days = Math.floor(time.hours / 24);
    const remainingHours = time.hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  // If more than 1 hour, show hours and minutes
  if (time.hours > 0) {
    return `${time.hours}h ${time.minutes}m`;
  }

  // If less than 1 hour but more than 5 minutes, show minutes only
  if (time.minutes > 5) {
    return `${time.minutes}m`;
  }

  // In the last 5 minutes, show minutes and seconds
  return `${time.minutes}m ${time.seconds}s`;
};

export default function SixNationsQuestionPicker() {
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Map<string, string>>(
    new Map()
  );
  const [answerResults, setAnswerResults] = useState<
    Map<string, { isCorrect: boolean | null; points: number }>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMatches, setOpenMatches] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasSubmittedBefore, setHasSubmittedBefore] = useState(false);

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [matchesData, questionsData, userAnswersData] = await Promise.all([
        matchesAPI.getAll(),
        questionsAPI.getAll(),
        answersAPI.getUserAnswers().catch(() => []), // Don't fail if no answers yet
      ]);

      // Open the first match by default if data exists
      if (matchesData.length > 0) {
        setOpenMatches(new Set([matchesData[0].id]));
      }

      setMatches(matchesData);
      setQuestions(questionsData);

      // Load user's previous answers
      const answersMap = new Map<string, string>();
      const resultsMap = new Map<
        string,
        { isCorrect: boolean | null; points: number }
      >();

      for (const answer of userAnswersData) {
        answersMap.set(answer.questionId, answer.answer);
        if (answer.question) {
          resultsMap.set(answer.questionId, {
            isCorrect: answer.isCorrect,
            points: answer.question.points,
          });
        }
      }

      // Check if user has submitted before (has any answers for this round)
      setHasSubmittedBefore(userAnswersData.length > 0);
      setUserAnswers(answersMap);
      setAnswerResults(resultsMap);
    } catch (error) {
      console.error("Error loading Six Nations data:", error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMatch = (matchId: string) => {
    const newOpenMatches = new Set(openMatches);
    if (newOpenMatches.has(matchId)) {
      newOpenMatches.delete(matchId);
    } else {
      newOpenMatches.add(matchId);
    }
    setOpenMatches(newOpenMatches);
  };

  const handleAnswerChange = (
    questionId: string,
    answer: string,
    matchId: string
  ) => {
    // Find the match and check if it's locked
    const match = matches.find((m) => m.id === matchId);
    if (match && isMatchLocked(match.matchDate)) {
      toast({
        title: "Match is locked",
        description:
          "This match is within 1 hour of kickoff. Picks are no longer allowed.",
        variant: "destructive",
      });
      return;
    }

    const newAnswers = new Map(userAnswers);
    const currentAnswer = newAnswers.get(questionId);

    // If clicking the same answer, deselect it
    if (currentAnswer === answer) {
      newAnswers.delete(questionId);
    } else {
      newAnswers.set(questionId, answer);
    }

    setUserAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    // Filter out questions from locked matches
    const unlockedQuestions = questions.filter((q) => {
      const match = matches.find((m) => m.id === q.matchId);
      return match && !isMatchLocked(match.matchDate);
    });

    const PICK_LIMIT = unlockedQuestions.length;
    const answeredUnlockedQuestions = unlockedQuestions.filter((q) =>
      userAnswers.has(q.id)
    ).length;

    if (answeredUnlockedQuestions !== PICK_LIMIT) {
      toast({
        title: "All unlocked picks required",
        description: `Please make sure you have answered all ${PICK_LIMIT} available questions before submitting.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const answers: UserAnswer[] = Array.from(userAnswers.entries()).map(
        ([questionId, answer]) => ({
          questionId,
          answer,
        })
      );

      console.log("Submitting answers:", answers);

      // Submit answers to backend
      await answersAPI.submit(answers);

      // Show confetti only on first submission
      if (!hasSubmittedBefore) {
        // Confetti celebration - Six Nations colors (green, white, blue)
        confetti({
          particleCount: 120,
          spread: 150,
          origin: { y: 0.6 },
          colors: [
            "#16a34a", // green-600
            "#22c55e", // green-500
            "#10b981", // emerald-500
            "#ffffff", // white
            "#3b82f6", // blue-500
            "#2563eb", // blue-600
          ],
          scalar: 1.1,
          startVelocity: 30,
        });

        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 150,
            origin: { y: 0.65 },
            colors: [
              "#16a34a", // green-600
              "#22c55e", // green-500
              "#10b981", // emerald-500
              "#ffffff", // white
              "#3b82f6", // blue-500
              "#2563eb", // blue-600
            ],
            scalar: 1.2,
          });
        }, 300);
      }

      toast({
        title: hasSubmittedBefore ? "Answers Updated" : "Submissions Received",
        description: hasSubmittedBefore
          ? `Successfully updated ${answers.length} prediction(s).`
          : `Successfully recorded ${answers.length} prediction(s). Good luck!`,
        className: "bg-green-600 text-white border-none",
      });

      // Mark as submitted for future updates
      setHasSubmittedBefore(true);

      // Reload data to show updated answers
      await loadData();
    } catch (error) {
      console.error("Error submitting answers:", error);
      toast({
        title: "Error",
        description: "Failed to submit answers",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group questions by match
  const questionsByMatch = questions.reduce((acc, question) => {
    if (!acc[question.matchId]) {
      acc[question.matchId] = [];
    }
    acc[question.matchId].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  // Sort questions within each match
  Object.values(questionsByMatch).forEach((matchQuestions) => {
    matchQuestions.sort((a, b) => a.questionNumber - b.questionNumber);
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
        <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-primary" />
        <p className="text-xs sm:text-sm text-muted-foreground font-medium animate-pulse">
          Loading Fixtures...
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="border-dashed shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-14 text-center">
          <div className="bg-muted/50 p-3 rounded-full mb-3">
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">
            No Questions Active
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
            Fixtures and prediction questions for the Six Nations will appear
            here soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter out questions from locked matches for progress calculation
  const unlockedQuestions = questions.filter((q) => {
    const match = matches.find((m) => m.id === q.matchId);
    return match && !isMatchLocked(match.matchDate);
  });

  const PICK_LIMIT = unlockedQuestions.length;
  const answeredQuestions = unlockedQuestions.filter((q) =>
    userAnswers.has(q.id)
  ).length;
  const progressPercentage =
    PICK_LIMIT > 0 ? (answeredQuestions / PICK_LIMIT) * 100 : 0;
  const picksComplete = answeredQuestions === PICK_LIMIT && PICK_LIMIT > 0;

  // Get the active round name from the first match (all matches are from the same active round)
  const activeRoundName =
    matches.length > 0
      ? matches[0].round?.name || matches[0].roundName || "Six Nations"
      : "Six Nations";

  return (
    <div className="space-y-3 sm:space-y-4 pb-24 sm:pb-0">
      {/* Header Section - Compact */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                {activeRoundName}
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500">
              Answer all questions to compete on the leaderboard
            </p>
          </div>

          {/* Progress Card - WhatsApp Style */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-2.5 sm:px-3.5 sm:py-3 flex items-center gap-2.5 sm:gap-3 self-start">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-gray-200"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <path
                  className={cn(
                    "transition-all duration-500 ease-out",
                    picksComplete ? "text-green-500" : "text-blue-500"
                  )}
                  strokeDasharray={`${progressPercentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[11px] sm:text-xs font-bold text-slate-700">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Progress
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-900">
                {answeredQuestions}/{PICK_LIMIT}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Matches List - Compact */}
      <div className="space-y-2 sm:space-y-3">
        {Object.entries(questionsByMatch).map(([matchId, matchQuestions]) => {
          const match = matches.find((m) => m.id === matchId);
          if (!match) return null;

          const isOpen = openMatches.has(matchId);
          const matchLocked = isMatchLocked(match.matchDate);

          // Calculate per-match progress
          const matchAnsweredCount = matchQuestions.filter((q) =>
            userAnswers.has(q.id)
          ).length;
          const matchTotalCount = matchQuestions.length;
          const matchProgress = (matchAnsweredCount / matchTotalCount) * 100;
          const matchComplete = matchAnsweredCount === matchTotalCount;

          return (
            <Collapsible
              key={matchId}
              open={isOpen}
              onOpenChange={() => toggleMatch(matchId)}
              className="group"
            >
              <Card className="overflow-hidden transition-all duration-300 border border-slate-200 shadow-sm">
                {/* Match Header / Trigger */}
                <CollapsibleTrigger asChild>
                  <div className="cursor-pointer bg-white hover:bg-slate-50/50 transition-colors">
                    {/* Status Bar with Progress - Thin */}
                    <div className="h-0.5 sm:h-1 w-full bg-slate-200 relative overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          matchLocked
                            ? "bg-red-500"
                            : matchComplete
                            ? "bg-green-500"
                            : matchAnsweredCount > 0
                            ? "bg-blue-500"
                            : "bg-slate-200"
                        )}
                        style={{
                          width: matchLocked ? "100%" : `${matchProgress}%`,
                        }}
                      />
                    </div>

                    <div className="p-2.5 sm:p-4">
                      {/* Top Metadata Row - Compact */}
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-600 border-0 rounded px-1.5 py-0 h-4 sm:h-5 text-[8px] sm:text-[9px]"
                          >
                            {match.round?.name ||
                              match.roundName ||
                              activeRoundName}
                          </Badge>
                          {/* Per-match progress badge */}
                          <Badge
                            variant="secondary"
                            className={cn(
                              "border-0 rounded px-1.5 py-0 h-4 sm:h-5 font-semibold text-[8px] sm:text-[9px]",
                              matchLocked
                                ? "bg-red-100 text-red-700"
                                : matchComplete
                                ? "bg-green-100 text-green-700"
                                : matchAnsweredCount > 0
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {matchLocked ? (
                              <>
                                <Lock className="w-2.5 h-2.5 inline mr-0.5" />
                                Locked
                              </>
                            ) : (
                              <>
                                {matchAnsweredCount}/{matchTotalCount}
                                {matchComplete && " ✓"}
                              </>
                            )}
                          </Badge>
                          {/* Countdown timer badge */}
                          {!matchLocked && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "border-0 rounded px-1.5 py-0 h-4 sm:h-5 font-semibold flex items-center gap-0.5 text-[8px] sm:text-[9px]",
                                getTimeUntilLock(match.matchDate).totalSeconds <
                                  3600
                                  ? "bg-amber-100 text-amber-700 animate-pulse"
                                  : "bg-slate-100 text-slate-600"
                              )}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              {formatTimeUntilLock(match.matchDate)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-2.5">
                          {match.matchDate && (
                            <span className="hidden sm:flex items-center gap-0.5 text-[9px] sm:text-[10px]">
                              <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              {new Date(match.matchDate).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" }
                              )}
                            </span>
                          )}
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 transition-transform duration-300",
                              isOpen && "rotate-180"
                            )}
                          />
                        </div>
                      </div>

                      {/* Teams Grid - Ultra Compact */}
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-2">
                        {/* Home Team */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center">
                            <TeamFlag
                              teamName={match.homeTeam}
                              className="text-2xl sm:text-4xl"
                            />
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 text-center truncate max-w-full">
                            {match.homeTeam}
                          </span>
                        </div>

                        {/* VS Badge */}
                        <div className="flex flex-col items-center justify-center px-0.5">
                          <span className="text-[8px] sm:text-[9px] font-black text-slate-300 bg-slate-100 rounded-full px-1.5 py-0.5">
                            VS
                          </span>
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center">
                            <TeamFlag
                              teamName={match.awayTeam}
                              className="text-2xl sm:text-4xl"
                            />
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 text-center truncate max-w-full">
                            {match.awayTeam}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Date/Venue Footer - Compact */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex sm:hidden items-center justify-center gap-2 text-[9px] text-slate-500">
                        {match.matchDate && (
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(match.matchDate).toLocaleDateString(
                              undefined,
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                        )}
                        {match.venue && (
                          <span className="flex items-center gap-0.5 truncate max-w-[150px]">
                            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{match.venue}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="bg-slate-50/50 p-2 sm:p-4 space-y-2 sm:space-y-3 border-t border-slate-100">
                    {matchLocked && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 text-red-700">
                        <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <p className="text-[10px] sm:text-xs font-medium">
                          This match is locked. Picks are no longer allowed
                          within 1 hour of kickoff.
                        </p>
                      </div>
                    )}
                    {!matchLocked &&
                      getTimeUntilLock(match.matchDate).totalSeconds < 3600 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 text-amber-700">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 animate-pulse" />
                          <p className="text-[10px] sm:text-xs font-medium">
                            Locking soon! You have{" "}
                            {formatTimeUntilLock(match.matchDate)} remaining.
                          </p>
                        </div>
                      )}
                    {matchQuestions.map((question) => {
                      const hasAnswer = userAnswers.has(question.id);
                      const userAnswer = userAnswers.get(question.id);
                      const result = answerResults.get(question.id);
                      const isScored =
                        result?.isCorrect !== null &&
                        result?.isCorrect !== undefined;

                      return (
                        <div
                          key={question.id}
                          className={cn(
                            "relative bg-white rounded-lg border p-2 sm:p-3 transition-all duration-200",
                            matchLocked
                              ? "border-red-200 bg-red-50/30 opacity-60"
                              : isScored && result.isCorrect
                              ? "border-green-300 bg-green-50/50 shadow-sm"
                              : isScored && !result.isCorrect
                              ? "border-red-300 bg-red-50/50 shadow-sm"
                              : hasAnswer
                              ? "border-blue-200 shadow-sm"
                              : "border-slate-200"
                          )}
                        >
                          <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 flex items-center gap-1.5">
                            {isScored && result.isCorrect && (
                              <div className="flex items-center gap-0.5 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold">
                                +{result.points}
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              </div>
                            )}
                            {isScored && !result.isCorrect && (
                              <div className="flex items-center gap-0.5 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold">
                                <Circle className="w-2.5 h-2.5" />
                              </div>
                            )}
                            {!isScored && matchLocked && (
                              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                            )}
                            {!isScored && !matchLocked && hasAnswer && (
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                            )}
                            {!isScored && !matchLocked && !hasAnswer && (
                              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-200" />
                            )}
                          </div>

                          <div className="mb-2 sm:mb-2.5 pr-12 sm:pr-14">
                            <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                Q{question.questionNumber}
                              </span>
                              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                {question.points} Pt
                                {question.points !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <p className="font-medium text-slate-800 text-xs sm:text-sm leading-snug">
                              {question.questionText}
                            </p>
                          </div>

                          <RadioGroup
                            className={cn(
                              "grid gap-1.5 sm:gap-2",
                              question.questionType === "yes_no" ||
                                (question.options &&
                                  question.options.length <= 2)
                                ? "grid-cols-2"
                                : "grid-cols-1 sm:grid-cols-2"
                            )}
                          >
                            {question.questionType === "yes_no"
                              ? ["Yes", "No"].map((opt) => (
                                  <AnswerOption
                                    key={opt}
                                    questionId={question.id}
                                    matchId={matchId}
                                    id={`${question.id}-${opt}`}
                                    value={opt}
                                    isSelected={userAnswer === opt}
                                    onSelect={handleAnswerChange}
                                    label={opt}
                                    isLocked={matchLocked}
                                  />
                                ))
                              : question.options?.map((option, index) => (
                                  <AnswerOption
                                    key={index}
                                    questionId={question.id}
                                    matchId={matchId}
                                    id={`${question.id}-${index}`}
                                    value={option}
                                    isSelected={userAnswer === option}
                                    onSelect={handleAnswerChange}
                                    label={option}
                                    isLocked={matchLocked}
                                  />
                                ))}
                          </RadioGroup>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-20 sm:sticky sm:bottom-4 left-0 right-0 sm:left-auto sm:right-auto p-3 sm:p-4 bg-white/95 sm:bg-white/90 backdrop-blur-md border-t sm:border sm:rounded-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] sm:shadow-lg z-[90] sm:mx-4 sm:mb-4 sm:max-w-2xl sm:mx-auto">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          {/* Mobile: Compact progress indicator */}
          <div className="flex items-center gap-2 sm:hidden">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-gray-200"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <path
                  className={cn(
                    "transition-all duration-500 ease-out",
                    picksComplete ? "text-green-500" : "text-blue-500"
                  )}
                  strokeDasharray={`${progressPercentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-slate-700">
                {answeredQuestions}/{PICK_LIMIT}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-900">
                {picksComplete
                  ? "Ready!"
                  : PICK_LIMIT - answeredQuestions + " remaining"}
              </span>
              <span className="text-[10px] text-slate-500">
                {picksComplete ? "Tap to submit" : `Answer all ${PICK_LIMIT}`}
              </span>
            </div>
          </div>

          {/* Desktop: Full progress display */}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900">
              {picksComplete
                ? `All ${PICK_LIMIT} questions answered!`
                : `${PICK_LIMIT - answeredQuestions} questions remaining`}
            </p>
            <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  picksComplete ? "bg-green-500" : "bg-blue-600"
                )}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex-1 sm:flex-none">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !picksComplete}
              className={cn(
                "w-full sm:w-auto font-semibold transition-all duration-300 h-10 sm:h-11 px-5 sm:px-8 text-sm sm:text-base rounded-lg",
                picksComplete
                  ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-[1.02]"
                  : "bg-gradient-to-r from-slate-800 to-slate-700 text-white/60 cursor-not-allowed shadow-sm"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>
                    {hasSubmittedBefore ? "Updating..." : "Sending..."}
                  </span>
                </>
              ) : (
                <>
                  <span>{hasSubmittedBefore ? "Update" : "Submit"}</span>
                  {answeredQuestions > 0 && (
                    <span className="ml-2 bg-white/25 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-bold">
                      {answeredQuestions}
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Subcomponents ---

interface AnswerOptionProps {
  questionId: string;
  matchId: string;
  id: string;
  value: string;
  label: string;
  isSelected: boolean;
  onSelect: (questionId: string, answer: string, matchId: string) => void;
  isLocked: boolean;
}

function AnswerOption({
  questionId,
  matchId,
  id,
  value,
  label,
  isSelected,
  onSelect,
  isLocked,
}: AnswerOptionProps) {
  return (
    <div className="relative">
      <RadioGroupItem value={value} id={id} className="peer sr-only" />
      <Label
        htmlFor={id}
        className={cn(
          "flex items-center justify-between p-2 sm:p-2.5 rounded-md border-2 transition-all duration-200",
          isLocked
            ? "cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200 opacity-50"
            : "cursor-pointer hover:bg-slate-50",
          !isLocked && isSelected
            ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm"
            : !isLocked
            ? "border-transparent bg-slate-100 text-slate-700 hover:border-slate-200"
            : ""
        )}
        onClick={() => !isLocked && onSelect(questionId, value, matchId)}
      >
        <span className="text-[11px] sm:text-xs font-semibold">{label}</span>
        {isSelected && (
          <div
            className={cn(
              "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex items-center justify-center",
              isLocked ? "bg-slate-400" : "bg-blue-600"
            )}
          >
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full" />
          </div>
        )}
        {!isSelected && (
          <div
            className={cn(
              "w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 rounded-full",
              isLocked ? "border-slate-300" : "border-slate-300"
            )}
          />
        )}
      </Label>
    </div>
  );
}
