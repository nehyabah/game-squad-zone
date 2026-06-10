import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, Loader2, ChevronDown, Calendar, MapPin,
  Lock, Clock, AlertTriangle,
} from "lucide-react";
import { FifaTeamFlag } from "@/lib/utils/fifa";
import {
  fifaQuestionsAPI, fifaMatchesAPI, fifaAnswersAPI, fifaRoundsAPI,
  FifaMatch, FifaQuestion, FifaRound,
} from "@/lib/api/fifa";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

const isRoundLocked = (round: FifaRound): boolean =>
  round.isLocked || (!!round.lockTime && new Date() >= new Date(round.lockTime));

const getLockLabel = (round: FifaRound): string | null => {
  if (round.isLocked) return "Locked by admin";
  if (!round.lockTime) return null;
  const diff = new Date(round.lockTime).getTime() - Date.now();
  if (diff <= 0) return "Submissions closed";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 48) return `Locks in ${Math.floor(h / 24)}d`;
  if (h > 0) return `Locks in ${h}h ${m}m`;
  return `Locks in ${m}m`;
};

const MAX_PTS: Record<number, number> = { 0: 45, 1: 48, 2: 96, 3: 64, 4: 40, 5: 36, 6: 21 };

const ROUND_SHORT: Record<number, string> = {
  0: "Predictions", 1: "Groups", 2: "R32", 3: "R16", 4: "QF", 5: "SF", 6: "Final",
};

export default function FifaQuestionPicker() {
  const [rounds, setRounds] = useState<FifaRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [matches, setMatches] = useState<FifaMatch[]>([]);
  const [questions, setQuestions] = useState<FifaQuestion[]>([]);
  const [existingAnswers, setExistingAnswers] = useState<Map<string, string>>(new Map());
  const [pendingAnswers, setPendingAnswers] = useState<Map<string, string>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
  const sliderRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fifaRoundsAPI.getAll().then((data) => {
      setRounds(data);
      const active = data.find((r) => r.isActive);
      setSelectedRoundId(active?.id ?? data[0]?.id ?? null);
    }).catch(() => toast({ title: "Error", description: "Failed to load rounds", variant: "destructive" }))
      .finally(() => setLoadingRounds(false));
  }, []);

  useEffect(() => {
    if (!selectedRoundId) return;
    setLoadingContent(true);
    setPendingAnswers(new Map());
    Promise.all([
      fifaMatchesAPI.getAll(selectedRoundId),
      fifaQuestionsAPI.getAll(selectedRoundId),
      fifaAnswersAPI.getUserAnswers(selectedRoundId),
    ]).then(([matchData, questionData, answerData]) => {
      setMatches(matchData);
      setQuestions(questionData);
      const map = new Map<string, string>();
      answerData.forEach((a) => { if (a.answer) map.set(a.questionId, a.answer); });
      setExistingAnswers(map);
      if (matchData.length > 0) setExpandedMatches(new Set([matchData[0].id]));
    }).catch(() => toast({ title: "Error", description: "Failed to load fixtures", variant: "destructive" }))
      .finally(() => setLoadingContent(false));
  }, [selectedRoundId]);

  useEffect(() => {
    if (!sliderRef.current || !selectedRoundId) return;
    const el = sliderRef.current.querySelector(`[data-round-id="${selectedRoundId}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [rounds, selectedRoundId]);

  const selectedRound = rounds.find((r) => r.id === selectedRoundId) ?? null;
  const locked = selectedRound ? isRoundLocked(selectedRound) : true;
  const lockLabel = selectedRound ? getLockLabel(selectedRound) : null;

  const handleAnswerChange = (questionId: string, answer: string) => {
    if (locked) return;
    setPendingAnswers((prev) => new Map(prev).set(questionId, answer));
  };

  const handleSubmit = async () => {
    const toSubmit = Array.from(pendingAnswers.entries()).map(([questionId, answer]) => ({ questionId, answer }));
    if (!toSubmit.length) return;
    setSubmitting(true);
    try {
      const result = await fifaAnswersAPI.submit(toSubmit);
      const saved = Array.isArray(result) ? result : (result as any).saved || [];
      const map = new Map(existingAnswers);
      saved.forEach((a: any) => map.set(a.questionId, a.answer));
      setExistingAnswers(map);
      setPendingAnswers(new Map());
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast({ title: `${saved.length} pick${saved.length !== 1 ? "s" : ""} saved! ⚽` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to save picks", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMatch = (id: string) => setExpandedMatches((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const getRoundDirectQs = (id: string) => questions.filter((q) => q.roundId === id);
  const getMatchQs = (id: string) => questions.filter((q) => q.matchId === id);
  const answeredCount = questions.filter((q) => existingAnswers.has(q.id) || pendingAnswers.has(q.id)).length;
  const hasPending = pendingAnswers.size > 0;
  const isRound0 = selectedRound?.roundNumber === 0;
  const isRound1 = selectedRound?.roundNumber === 1;
  const roundMatches = matches.filter((m) => m.roundId === selectedRoundId);
  const bothEarlyRoundsActive = rounds.filter((r) => r.isActive && r.roundNumber <= 1).length === 2;
  const progressPct = questions.length ? (answeredCount / questions.length) * 100 : 0;

  if (loadingRounds) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading World Cup picks…</p>
      </div>
    );
  }

  if (rounds.length === 0) {
    return <EmptyState title="Coming soon" subtitle="Rounds will be set up before the tournament." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50">
        {/* Glass base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1829] via-[#091420] to-[#060d1a]" />
        {/* Light orb — emerald top-right */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-emerald-500/25 blur-3xl pointer-events-none" />
        {/* Light orb — blue bottom-left */}
        <div className="absolute -bottom-10 -left-8 w-32 h-32 rounded-full bg-sky-600/15 blur-3xl pointer-events-none" />
        {/* Glass surface: diagonal refraction from top-left */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent pointer-events-none" />
        {/* Top glass highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        {/* Bottom emerald accent */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

        <div className="relative px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src="/2026_FIFA_World_Cup_emblem.svg.webp"
              alt="FIFA WC 2026"
              className="w-12 h-12 object-contain flex-shrink-0 drop-shadow-lg"
            />
            <div className="min-w-0">
              <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                FIFA World Cup
              </p>
              <h2 className="text-white font-black text-xl leading-none tracking-tight">2026</h2>
              {!loadingContent && questions.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-1 w-28 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-white/50 text-[11px] font-semibold tabular-nums">
                    {answeredCount}/{questions.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {hasPending && !locked && (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold gap-1.5 flex-shrink-0 shadow-lg shadow-emerald-900/40 rounded-xl px-4"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Save {pendingAnswers.size}
            </Button>
          )}
        </div>
      </div>

      {/* ── Both early rounds notice ───────────────────────────────────── */}
      {bothEarlyRoundsActive && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Predictions</strong> and <strong>Group Stage</strong> are both open — submit picks for both before the tournament starts.
          </p>
        </div>
      )}

      {/* ── Round tabs ────────────────────────────────────────────────── */}
      <div
        ref={sliderRef}
        className="flex gap-1 overflow-x-auto pb-1 -mx-0.5 px-0.5"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}
      >
        {[...rounds].sort((a, b) => a.roundNumber - b.roundNumber).map((round) => {
          const isSel = round.id === selectedRoundId;
          const isActive = round.isActive;
          const isLocked = isRoundLocked(round);
          return (
            <button
              key={round.id}
              data-round-id={round.id}
              onClick={() => setSelectedRoundId(round.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border whitespace-nowrap",
                isSel
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/30"
                  : isActive
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                  : "bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground"
              )}
            >
              <span className={cn(
                "text-[9px] font-black rounded px-1 py-0.5 leading-none",
                isSel ? "bg-white/20 text-white" : "bg-current/10 opacity-60"
              )}>
                R{round.roundNumber}
              </span>
              <span className="hidden sm:inline">{round.name}</span>
              <span className="sm:hidden">{ROUND_SHORT[round.roundNumber] ?? round.name}</span>
              {isActive && (
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  isSel ? "bg-white/80" : "bg-primary animate-pulse"
                )} />
              )}
              {isLocked && !isActive && (
                <Lock className="w-2.5 h-2.5 opacity-40 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Round status strip ────────────────────────────────────────── */}
      {selectedRound && (
        <div className={cn(
          "flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-xs",
          locked
            ? "bg-muted/30 border-border/50 text-muted-foreground"
            : "bg-primary/5 border-primary/15 text-foreground"
        )}>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{selectedRound.name}</span>
            {selectedRound.isActive && !locked && (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5 text-[10px]">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />OPEN
              </span>
            )}
            {locked && (
              <span className="inline-flex items-center gap-1 font-bold text-muted-foreground bg-muted border border-border rounded-full px-1.5 py-0.5 text-[10px]">
                <Lock className="w-2 h-2" />LOCKED
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-muted-foreground">
              {selectedRound.pointsPerQuestion}pts · max {MAX_PTS[selectedRound.roundNumber] ?? "?"} pts
            </span>
            {lockLabel && !locked && (
              <span className="flex items-center gap-1 font-semibold text-amber-600">
                <Clock className="w-3 h-3" /> {lockLabel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────── */}
      {loadingContent ? (
        <div className="flex flex-col items-center justify-center py-14 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading questions…</p>
        </div>
      ) : (
        <div className="space-y-3">

          {/* Round 0 & 1 direct questions */}
          {(isRound0 || isRound1) && (
            <>
              {getRoundDirectQs(selectedRoundId!).map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  locked={locked}
                  currentAnswer={pendingAnswers.get(q.id) ?? existingAnswers.get(q.id)}
                  onAnswer={handleAnswerChange}
                />
              ))}

              {isRound1 && roundMatches.map((match) => {
                const mqs = getMatchQs(match.id);
                if (!mqs.length) return null;
                const groupTeams = match.groupTeams as string[] | null;
                const isExpanded = expandedMatches.has(match.id);
                const answered = mqs.filter((q) => existingAnswers.has(q.id) || pendingAnswers.has(q.id)).length;
                return (
                  <Collapsible key={match.id} open={isExpanded} onOpenChange={() => toggleMatch(match.id)}>
                    <CollapsibleTrigger asChild>
                      <button className={cn(
                        "w-full text-left rounded-xl border p-4 transition-all hover:shadow-sm",
                        isExpanded ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:border-primary/20"
                      )}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                            <span className="font-bold text-sm">{match.homeTeam}</span>
                            {groupTeams?.map((t) => (
                              <span key={t} className="inline-flex items-center gap-1 text-xs bg-muted border border-border px-2 py-0.5 rounded-full">
                                <FifaTeamFlag teamName={t} className="text-xs" /> {t}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn(
                              "text-xs font-semibold px-2 py-0.5 rounded-full",
                              answered === mqs.length ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                            )}>{answered}/{mqs.length}</span>
                            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
                          </div>
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 space-y-2 pl-1">
                        {mqs.map((q) => (
                          <QuestionCard
                            key={q.id}
                            question={q}
                            locked={locked}
                            currentAnswer={pendingAnswers.get(q.id) ?? existingAnswers.get(q.id)}
                            onAnswer={handleAnswerChange}
                            compact
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}

              {getRoundDirectQs(selectedRoundId!).length === 0 && roundMatches.length === 0 && (
                <EmptyState title="Questions coming soon" subtitle="Check back closer to the tournament start." />
              )}
            </>
          )}

          {/* Rounds 2–6 match cards */}
          {!isRound0 && !isRound1 && (
            <>
              {roundMatches.map((match) => {
                const mqs = getMatchQs(match.id);
                const isExpanded = expandedMatches.has(match.id);
                const answered = mqs.filter((q) => existingAnswers.has(q.id) || pendingAnswers.has(q.id)).length;
                const allDone = mqs.length > 0 && answered === mqs.length;
                return (
                  <Collapsible key={match.id} open={isExpanded} onOpenChange={() => toggleMatch(match.id)}>
                    <CollapsibleTrigger asChild>
                      <button className={cn(
                        "w-full text-left rounded-xl border transition-all overflow-hidden",
                        isExpanded ? "border-primary/30 shadow-sm" : "border-border hover:border-primary/20 hover:shadow-sm",
                        locked && "opacity-75"
                      )}>
                        {/* Team matchup bar */}
                        <div className={cn(
                          "px-4 py-3",
                          allDone ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-card"
                        )}>
                          {/* Teams */}
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <FifaTeamFlag teamName={match.homeTeam} className="text-2xl flex-shrink-0" />
                              <span className="font-bold text-sm leading-tight truncate">{match.homeTeam}</span>
                            </div>
                            <div className="flex flex-col items-center flex-shrink-0">
                              {match.completed && match.homeScore !== null ? (
                                <span className="text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded-md tracking-wide tabular-nums">
                                  {match.homeScore} – {match.awayScore}
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-md tracking-widest">
                                  VS
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 min-w-0 justify-end">
                              <span className="font-bold text-sm leading-tight truncate text-right">{match.awayTeam}</span>
                              <FifaTeamFlag teamName={match.awayTeam} className="text-2xl flex-shrink-0" />
                            </div>
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-border/50">
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(match.matchDate).toLocaleDateString("en-GB", {
                                  weekday: "short", day: "numeric", month: "short",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </span>
                              {match.venue && (
                                <span className="hidden sm:flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />{match.venue}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {mqs.length > 0 && (
                                <span className={cn(
                                  "text-[11px] font-bold px-2 py-0.5 rounded-full",
                                  allDone
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-muted text-muted-foreground"
                                )}>
                                  {answered}/{mqs.length} picks
                                </span>
                              )}
                              <ChevronDown className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                                isExpanded && "rotate-180"
                              )} />
                            </div>
                          </div>
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 space-y-2 px-1">
                        {mqs.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">No questions added yet</p>
                        ) : mqs.map((q) => (
                          <QuestionCard
                            key={q.id}
                            question={q}
                            locked={locked}
                            currentAnswer={pendingAnswers.get(q.id) ?? existingAnswers.get(q.id)}
                            onAnswer={handleAnswerChange}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}

              {roundMatches.length === 0 && (
                <EmptyState
                  title="Fixtures not set up yet"
                  subtitle={`Check back once the ${selectedRound?.name} fixtures are confirmed.`}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Sticky save */}
      {hasPending && !locked && (
        <div className="sticky bottom-20 sm:bottom-6 flex justify-center pt-2">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="shadow-xl gap-2 px-8 py-2.5 rounded-full font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save {pendingAnswers.size} Pick{pendingAnswers.size !== 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <img src="/2026_FIFA_World_Cup_emblem.svg.webp" alt="FIFA World Cup 2026" className="w-16 h-16 object-contain opacity-60" />
      <div className="text-center space-y-1">
        <p className="font-bold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground max-w-xs">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Question card ────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: FifaQuestion;
  locked: boolean;
  currentAnswer?: string;
  onAnswer: (questionId: string, answer: string) => void;
  compact?: boolean;
}

function QuestionCard({ question, locked, currentAnswer, onAnswer, compact }: QuestionCardProps) {
  const options = question.questionType === "yes_no" ? ["Yes", "No"] : (question.options as string[] | null) ?? [];
  const isAnswered = !!currentAnswer;
  const showResult = !!question.correctAnswer;

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden transition-all duration-200",
      isAnswered && !locked ? "border-primary/25 shadow-sm" : "border-border",
    )}>
      {/* Question header */}
      <div className={cn(
        "px-4 py-3 flex items-start justify-between gap-3 border-b border-border/50",
        isAnswered && !locked ? "bg-primary/5" : "bg-muted/20"
      )}>
        <p className={cn(
          "font-semibold leading-snug flex-1",
          compact ? "text-xs" : "text-sm"
        )}>
          {question.questionText}
        </p>
        <span className={cn(
          "flex-shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 border mt-0.5",
          isAnswered && !locked
            ? "border-primary/30 text-primary bg-primary/8"
            : "border-border text-muted-foreground bg-background"
        )}>
          {question.points}pt{question.points !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Options */}
      <div className={cn("px-3 py-2.5 bg-background space-y-1.5", compact && "py-2")}>
        <RadioGroup
          value={currentAnswer || ""}
          onValueChange={(val) => !locked && onAnswer(question.id, val)}
          disabled={locked}
        >
          {options.map((option) => {
            const isSelected = currentAnswer === option;
            const isCorrect = question.correctAnswer === option;
            return (
              <div
                key={option}
                onClick={() => !locked && onAnswer(question.id, option)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-150 select-none",
                  // Ungraded states
                  !showResult && isSelected && "border-primary bg-primary/8 shadow-sm",
                  !showResult && !isSelected && !locked && "border-border hover:border-primary/40 hover:bg-muted/40",
                  !showResult && !isSelected && locked && "border-border opacity-50 cursor-not-allowed",
                  // Graded states
                  showResult && isCorrect && "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
                  showResult && isSelected && !isCorrect && "border-rose-400 bg-rose-50 dark:bg-rose-900/20",
                  showResult && !isSelected && !isCorrect && "border-border opacity-40",
                )}
              >
                <RadioGroupItem
                  value={option}
                  id={`${question.id}-${option}`}
                  disabled={locked}
                  className="flex-shrink-0"
                />
                <Label
                  htmlFor={`${question.id}-${option}`}
                  className={cn(
                    "flex-1 font-medium cursor-pointer",
                    compact ? "text-xs" : "text-sm",
                    locked && "cursor-not-allowed",
                    showResult && isCorrect && "text-emerald-700 dark:text-emerald-400",
                    showResult && isSelected && !isCorrect && "text-rose-700 dark:text-rose-400",
                  )}
                >
                  {option}
                </Label>
                {isSelected && !showResult && (
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                )}
                {showResult && isCorrect && (
                  <span className="text-emerald-600 font-bold text-xs flex-shrink-0">✓ Correct</span>
                )}
                {showResult && isSelected && !isCorrect && (
                  <span className="text-rose-500 text-xs flex-shrink-0">✗ Wrong</span>
                )}
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
}
