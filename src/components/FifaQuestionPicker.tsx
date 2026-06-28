import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, Loader2, ChevronDown, Calendar,
  Lock, Clock, AlertTriangle,
} from "lucide-react";
import { FifaTeamFlag, getFifaFlagClass } from "@/lib/utils/fifa";
import {
  fifaQuestionsAPI, fifaMatchesAPI, fifaAnswersAPI, fifaRoundsAPI,
  FifaMatch, FifaQuestion, FifaRound,
} from "@/lib/api/fifa";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

const isRoundLocked = (round: FifaRound): boolean =>
  round.isLocked || (!!round.lockTime && new Date() >= new Date(round.lockTime));

const getLockLabel = (round: FifaRound): string | null => {
  if (round.isLocked) return "Locked";
  if (!round.lockTime) return null;
  const diff = new Date(round.lockTime).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 48) return `${Math.floor(h / 24)}d left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
};

const MATCH_LOCK_MS = 60 * 60 * 1000;

const isMatchLocked = (matchDate: string): boolean =>
  new Date() >= new Date(new Date(matchDate).getTime() - MATCH_LOCK_MS);

const getMatchLockLabel = (matchDate: string): string | null => {
  const timeUntilLock = new Date(matchDate).getTime() - Date.now() - MATCH_LOCK_MS;
  if (timeUntilLock <= 0) return null;
  const h = Math.floor(timeUntilLock / 3600000);
  const m = Math.floor((timeUntilLock % 3600000) / 60000);
  if (h > 24) return null;
  if (h > 0) return `Locks in ${h}h ${m}m`;
  return `Locks in ${m}m`;
};

const MAX_PTS: Record<number, number> = { 0: 45, 1: 48, 2: 96, 3: 64, 4: 40, 5: 36, 6: 21 };

const ROUND_SHORT: Record<number, string> = {
  0: "Preds", 1: "Groups", 2: "R32", 3: "R16", 4: "QF", 5: "SF", 6: "Final",
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
  const [, setTick] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fifaRoundsAPI.getAll()
      .then((data) => {
        setRounds(data);
        const active = data.find((r) => r.isActive);
        setSelectedRoundId(active?.id ?? data[0]?.id ?? null);
      })
      .catch(() => toast({ title: "Error", description: "Failed to load rounds", variant: "destructive" }))
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
    })
      .catch(() => toast({ title: "Error", description: "Failed to load fixtures", variant: "destructive" }))
      .finally(() => setLoadingContent(false));
  }, [selectedRoundId]);

  useEffect(() => {
    if (!sliderRef.current || !selectedRoundId) return;
    const el = sliderRef.current.querySelector(`[data-round-id="${selectedRoundId}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [rounds, selectedRoundId]);

  // Re-render every minute so match lock countdowns stay accurate
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const selectedRound = rounds.find((r) => r.id === selectedRoundId) ?? null;
  const locked = selectedRound ? isRoundLocked(selectedRound) : true;
  const lockLabel = selectedRound ? getLockLabel(selectedRound) : null;
  const matchById = new Map(matches.map((m) => [m.id, m]));

  const handleAnswerChange = (questionId: string, answer: string) => {
    if (locked) return;
    const q = questions.find((q) => q.id === questionId);
    if (q?.matchId) {
      const m = matchById.get(q.matchId);
      if (m && isMatchLocked(m.matchDate)) return;
    }
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
    <div className="max-w-2xl mx-auto space-y-3">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1829] via-[#091420] to-[#060d1a]" />
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-emerald-500/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-8 w-32 h-32 rounded-full bg-sky-600/15 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

        <div className="relative px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/2026_FIFA_World_Cup_emblem.svg.webp"
              alt="FIFA WC 2026"
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0 drop-shadow-lg"
            />
            <div className="min-w-0">
              <p className="text-emerald-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5">
                FIFA World Cup
              </p>
              <h2 className="text-white font-black text-lg sm:text-xl leading-none tracking-tight">2026</h2>
              {!loadingContent && questions.length > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="h-1 w-20 sm:w-28 rounded-full bg-white/10 overflow-hidden">
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
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold gap-1.5 flex-shrink-0 shadow-lg shadow-emerald-900/40 rounded-xl h-9 px-3.5"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span className="text-xs">Save {pendingAnswers.size}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Both early rounds notice ───────────────────────────────────── */}
      {bothEarlyRoundsActive && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-amber-800 leading-snug">
            <strong>Predictions</strong> and <strong>Group Stage</strong> are both open — submit picks for both before the tournament starts.
          </p>
        </div>
      )}

      {/* ── Round tabs ────────────────────────────────────────────────── */}
      <div
        ref={sliderRef}
        className="flex gap-1 overflow-x-auto pb-0.5"
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
                "flex-shrink-0 flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all border whitespace-nowrap min-h-[36px]",
                isSel
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/30"
                  : isActive
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted/40 text-muted-foreground border-border/40"
              )}
            >
              <span className={cn(
                "text-[9px] font-black rounded px-1 py-0.5 leading-none",
                isSel ? "bg-white/20 text-white" : "opacity-50"
              )}>
                R{round.roundNumber}
              </span>
              {ROUND_SHORT[round.roundNumber] ?? round.name}
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
          "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 rounded-lg border text-xs",
          locked
            ? "bg-muted/30 border-border/50 text-muted-foreground"
            : "bg-primary/5 border-primary/15 text-foreground"
        )}>
          <div className="flex items-center gap-1.5 flex-wrap">
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
          <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
            <span>{selectedRound.pointsPerQuestion}pts · max {MAX_PTS[selectedRound.roundNumber] ?? "?"}pts</span>
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
                const allDone = mqs.length > 0 && answered === mqs.length;
                return (
                  <Collapsible key={match.id} open={isExpanded} onOpenChange={() => toggleMatch(match.id)}>
                    <CollapsibleTrigger asChild>
                      <button className={cn(
                        "w-full text-left rounded-xl border transition-all min-h-[56px]",
                        isExpanded ? "border-primary/30 bg-primary/5" : "border-border bg-card",
                        allDone && "border-emerald-200 bg-emerald-50/50"
                      )}>
                        <div className="flex items-center justify-between gap-2 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm leading-tight">{match.homeTeam}</p>
                            {groupTeams && groupTeams.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {groupTeams.map((t) => (
                                  <span key={t} className="inline-flex items-center gap-1 text-[11px] bg-muted border border-border/60 px-1.5 py-0.5 rounded-full font-medium">
                                    <FifaTeamFlag teamName={t} className="text-xs" /> {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded-full",
                              allDone ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                            )}>
                              {answered}/{mqs.length}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
                          </div>
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 space-y-2">
                        {mqs.map((q) => (
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
                const matchLocked = locked || isMatchLocked(match.matchDate);
                const matchLockLabel = !matchLocked ? getMatchLockLabel(match.matchDate) : null;
                return (
                  <Collapsible key={match.id} open={isExpanded} onOpenChange={() => toggleMatch(match.id)}>
                    <CollapsibleTrigger asChild>
                      <button className={cn(
                        "w-full text-left rounded-xl border transition-all overflow-hidden",
                        isExpanded ? "border-primary/30 shadow-sm" : "border-border",
                        matchLocked && "opacity-75"
                      )}>
                        <div className={cn(
                          "px-3 py-3 sm:px-4",
                          allDone ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-card"
                        )}>
                          {/* Teams — responsive layout */}
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <FifaTeamFlag teamName={match.homeTeam} className="text-xl sm:text-2xl flex-shrink-0" />
                              <span className="font-bold text-xs sm:text-sm leading-tight truncate">{match.homeTeam}</span>
                            </div>
                            <div className="flex flex-col items-center flex-shrink-0 px-1">
                              {match.completed && match.homeScore !== null ? (
                                <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded-md tabular-nums">
                                  {match.homeScore}–{match.awayScore}
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                                  VS
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0 justify-end">
                              <span className="font-bold text-xs sm:text-sm leading-tight truncate text-right">{match.awayTeam}</span>
                              <FifaTeamFlag teamName={match.awayTeam} className="text-xl sm:text-2xl flex-shrink-0" />
                            </div>
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              {new Date(match.matchDate).toLocaleDateString("en-GB", {
                                day: "numeric", month: "short",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {matchLocked && !locked && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted border border-border/60 rounded-full px-1.5 py-0.5">
                                  <Lock className="w-2.5 h-2.5" /> Locked
                                </span>
                              )}
                              {matchLockLabel && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                                  <Clock className="w-2.5 h-2.5" /> {matchLockLabel}
                                </span>
                              )}
                              {mqs.length > 0 && (
                                <span className={cn(
                                  "text-[11px] font-bold px-2 py-0.5 rounded-full",
                                  allDone ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                                )}>
                                  {answered}/{mqs.length}
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
                      <div className="mt-2 space-y-2">
                        {mqs.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">No questions added yet</p>
                        ) : mqs.map((q) => (
                          <QuestionCard
                            key={q.id}
                            question={q}
                            locked={matchLocked}
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

      {/* Sticky save — full-width on mobile */}
      {hasPending && !locked && (
        <div className="sticky bottom-20 sm:bottom-6 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto sm:mx-auto sm:flex shadow-xl gap-2 px-8 h-12 sm:h-11 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
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
    <div className="flex flex-col items-center justify-center py-14 gap-4">
      <img src="/2026_FIFA_World_Cup_emblem.svg.webp" alt="FIFA World Cup 2026" className="w-14 h-14 object-contain opacity-60" />
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
}

function QuestionCard({ question, locked, currentAnswer, onAnswer }: QuestionCardProps) {
  const options = question.questionType === "yes_no" ? ["Yes", "No"] : (question.options as string[] | null) ?? [];
  const isAnswered = !!currentAnswer;
  const showResult = !!question.correctAnswer;

  // Context flags set by admin — purely informational
  const contextTeams: string[] = (question.contextTeams as string[] | null) ?? [];

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
        <div className="flex-1 min-w-0 space-y-2">
          <p className="font-semibold text-sm leading-snug">
            {question.questionText}
          </p>
          {/* Context team flags — purely informational */}
          {contextTeams.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {contextTeams.map((team) => (
                <span
                  key={team}
                  className="inline-flex items-center gap-1 bg-muted/60 border border-border/60 rounded-full px-2 py-0.5"
                >
                  <FifaTeamFlag teamName={team} className="text-sm" />
                  <span className="text-[11px] text-muted-foreground font-medium leading-none">{team}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <span className={cn(
          "flex-shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 border mt-0.5 whitespace-nowrap",
          isAnswered && !locked
            ? "border-primary/30 text-primary bg-primary/8"
            : "border-border text-muted-foreground bg-background"
        )}>
          {question.points}pt{question.points !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Options — full-height touch targets */}
      <div className="px-3 py-2 bg-background space-y-1.5">
        <RadioGroup
          value={currentAnswer || ""}
          onValueChange={(val) => !locked && onAnswer(question.id, val)}
          disabled={locked}
        >
          {options.map((option) => {
            const isSelected = currentAnswer === option;
            const isCorrect = question.correctAnswer === option;
            const hasFlag = getFifaFlagClass(option) !== "fi fi-xx";
            return (
              <div
                key={option}
                onClick={() => !locked && onAnswer(question.id, option)}
                className={cn(
                  "flex items-center gap-3 px-3 rounded-lg border cursor-pointer transition-all duration-150 select-none min-h-[48px]",
                  !showResult && isSelected && "border-primary bg-primary/8 shadow-sm",
                  !showResult && !isSelected && !locked && "border-border hover:border-primary/40 hover:bg-muted/30 active:bg-muted/60",
                  !showResult && !isSelected && locked && "border-border opacity-50 cursor-not-allowed",
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
                    "flex-1 font-medium cursor-pointer flex items-center gap-2 text-sm py-3",
                    locked && "cursor-not-allowed",
                    showResult && isCorrect && "text-emerald-700 dark:text-emerald-400",
                    showResult && isSelected && !isCorrect && "text-rose-700 dark:text-rose-400",
                  )}
                >
                  {hasFlag && (
                    <FifaTeamFlag teamName={option} className="text-xl flex-shrink-0" />
                  )}
                  {option}
                </Label>
                {isSelected && !showResult && (
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                )}
                {showResult && isCorrect && (
                  <span className="text-emerald-600 font-bold text-xs flex-shrink-0">✓ Correct</span>
                )}
                {showResult && isSelected && !isCorrect && (
                  <span className="text-rose-500 text-xs flex-shrink-0">✗</span>
                )}
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
}
