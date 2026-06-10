import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2, XCircle, Clock, MapPin, Trophy,
  Loader2, Lock, Target,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fifaAnswersAPI, fifaRoundsAPI, fifaLeaderboardAPI,
  FifaUserAnswer, FifaRound, FifaLeaderboardEntry, FifaMatch,
} from "@/lib/api/fifa";
import { FifaTeamFlag } from "@/lib/utils/fifa";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getDisplayName, getInitials } from "@/lib/utils/user";
import { useAuth } from "@/hooks/use-auth";

const isRoundLocked = (round: FifaRound) =>
  round.isLocked || (!!round.lockTime && new Date() >= new Date(round.lockTime));

const ROUND_SHORT: Record<number, string> = {
  0: "Predictions", 1: "Groups", 2: "R32", 3: "R16", 4: "QF", 5: "SF", 6: "Final",
};

// ── Answer row ───────────────────────────────────────────────────────────────

const AnswerRow: React.FC<{ answer: FifaUserAnswer }> = ({ answer }) => {
  const status = answer.isCorrect === true ? "correct" : answer.isCorrect === false ? "wrong" : "pending";
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 border-b last:border-0 transition-colors",
      status === "correct" && "bg-emerald-50/60 dark:bg-emerald-900/10",
      status === "wrong" && "bg-rose-50/60 dark:bg-rose-900/10",
    )}>
      {/* Status icon */}
      <div className="flex-shrink-0 w-5 flex items-center justify-center">
        {status === "correct" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        {status === "wrong" && <XCircle className="w-4 h-4 text-rose-400" />}
        {status === "pending" && <Clock className="w-3.5 h-3.5 text-amber-400" />}
      </div>

      {/* Question + answer */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground leading-snug mb-0.5 truncate">
          {answer.question?.questionText}
        </p>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "text-sm font-bold",
            status === "correct" && "text-emerald-700",
            status === "wrong" && "text-rose-600 line-through opacity-70",
            status === "pending" && "text-foreground",
          )}>
            {answer.answer}
          </span>
          {status === "wrong" && answer.question?.correctAnswer && (
            <span className="text-sm font-bold text-emerald-700">
              → {answer.question.correctAnswer}
            </span>
          )}
        </div>
      </div>

      {/* Points / badge */}
      <div className="flex-shrink-0 text-right">
        {status === "correct" && (
          <span className="text-sm font-black text-emerald-600">
            +{answer.question?.points ?? 0}
          </span>
        )}
        {status === "pending" && (
          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
            Awaiting
          </span>
        )}
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

export default function MyFifaPicks() {
  const [rounds, setRounds] = useState<FifaRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<FifaUserAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<FifaLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardTotal, setLeaderboardTotal] = useState<FifaLeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState("picks");
  const sliderRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => { loadRounds(); }, []);

  useEffect(() => {
    if (selectedRoundId) loadAnswers(selectedRoundId);
  }, [selectedRoundId]);

  useEffect(() => {
    if (activeTab === "leaderboard" && selectedRoundId) loadLeaderboard();
  }, [activeTab, selectedRoundId]);

  useEffect(() => {
    if (!sliderRef.current || !selectedRoundId) return;
    const el = sliderRef.current.querySelector(`[data-round-id="${selectedRoundId}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [rounds, selectedRoundId]);

  const loadRounds = async () => {
    try {
      const data = await fifaRoundsAPI.getAll();
      setRounds(data);
      const active = data.find((r) => r.isActive);
      setSelectedRoundId(active?.id ?? data[0]?.id ?? null);
    } catch {
      toast({ title: "Error", description: "Failed to load rounds", variant: "destructive" });
    }
  };

  const loadAnswers = async (roundId: string) => {
    try {
      setLoading(true);
      const data = await fifaAnswersAPI.getUserAnswers(roundId);
      setAnswers(data);
    } catch {
      toast({ title: "Error", description: "Failed to load picks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    if (!selectedRoundId) return;
    setLeaderboardLoading(true);
    try {
      const [roundData, totalData] = await Promise.all([
        fifaLeaderboardAPI.get(selectedRoundId),
        fifaLeaderboardAPI.get(undefined, "total"),
      ]);
      setLeaderboard(roundData);
      setLeaderboardTotal(totalData);
    } catch {
      toast({ title: "Error", description: "Failed to load leaderboard", variant: "destructive" });
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const correct = answers.filter((a) => a.isCorrect === true).length;
  const wrong = answers.filter((a) => a.isCorrect === false).length;
  const pending = answers.filter((a) => a.isCorrect == null).length;
  const totalPoints = answers
    .filter((a) => a.isCorrect === true)
    .reduce((sum, a) => sum + (a.question?.points ?? 0), 0);
  const accuracy = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : null;

  const roundDirectAnswers = answers.filter((a) => !a.question?.match);
  const matchMap = new Map<string, { match: FifaMatch; answers: FifaUserAnswer[] }>();
  for (const answer of answers) {
    const match = answer.question?.match as FifaMatch | undefined;
    if (!match) continue;
    if (!matchMap.has(match.id)) matchMap.set(match.id, { match, answers: [] });
    matchMap.get(match.id)!.answers.push(answer);
  }

  const currentRound = rounds.find((r) => r.id === selectedRoundId);

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1829] via-[#091420] to-[#060d1a]" />
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-emerald-500/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-8 w-32 h-32 rounded-full bg-sky-600/15 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

        <div className="relative px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <img
                src="/2026_FIFA_World_Cup_emblem.svg.webp"
                alt="FIFA WC 2026"
                className="w-12 h-12 object-contain flex-shrink-0 drop-shadow-lg"
              />
              <div>
                <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                  My Picks
                </p>
                <h2 className="text-white font-black text-xl leading-none tracking-tight">World Cup 2026</h2>
              </div>
            </div>

            {/* Points pill */}
            <div className="flex-shrink-0 text-right">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Points</p>
              <p className="text-white font-black text-3xl leading-none tabular-nums">{totalPoints}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10">
            <StatPill label="Correct" value={correct} color="emerald" />
            <StatPill label="Wrong" value={wrong} color="rose" />
            <StatPill
              label={accuracy !== null ? `${accuracy}% acc.` : "Pending"}
              value={pending}
              color="amber"
            />
          </div>
        </div>
      </div>

      {/* ── Round selector ────────────────────────────────────────────── */}
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
                isSel ? "bg-white/20 text-white" : "opacity-60 bg-current/10"
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

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="picks" className="flex-1">My Picks</TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex-1">Leaderboard</TabsTrigger>
        </TabsList>

        {/* ── Picks tab ─────────────────────────────────────────────── */}
        <TabsContent value="picks" className="mt-3 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : roundDirectAnswers.length === 0 && matchMap.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Target className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">No picks yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Head to Fixtures to submit your {currentRound?.name} picks.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Round 0 & 1 — direct round answers */}
              {roundDirectAnswers.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
                    <span className="text-sm font-bold">{currentRound?.name ?? "Predictions"}</span>
                    <AnswerTally answers={roundDirectAnswers} />
                  </div>
                  {roundDirectAnswers.map((a) => <AnswerRow key={a.id} answer={a} />)}
                </div>
              )}

              {/* Round 2–6 — match-grouped answers */}
              {Array.from(matchMap.values()).map(({ match, answers: matchAnswers }) => (
                <div key={match.id} className="rounded-xl border border-border overflow-hidden shadow-sm">
                  {/* Match header */}
                  <div className="px-4 py-3 bg-muted/30 border-b border-border">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FifaTeamFlag teamName={match.homeTeam} className="text-xl flex-shrink-0" />
                        <span className="font-bold text-sm truncate">{match.homeTeam}</span>
                      </div>
                      <div className="flex-shrink-0">
                        {match.completed && match.homeScore !== null ? (
                          <span className="text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded-md tabular-nums">
                            {match.homeScore}–{match.awayScore}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md tracking-widest">
                            VS
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0 justify-end">
                        <span className="font-bold text-sm truncate text-right">{match.awayTeam}</span>
                        <FifaTeamFlag teamName={match.awayTeam} className="text-xl flex-shrink-0" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {match.matchDate && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {new Date(match.matchDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          {match.venue && ` · ${match.venue}`}
                        </p>
                      )}
                      <AnswerTally answers={matchAnswers} />
                    </div>
                  </div>
                  {matchAnswers.map((a) => <AnswerRow key={a.id} answer={a} />)}
                </div>
              ))}
            </>
          )}
        </TabsContent>

        {/* ── Leaderboard tab ───────────────────────────────────────── */}
        <TabsContent value="leaderboard" className="mt-3 space-y-5">
          {leaderboardLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <LeaderboardTable
                data={leaderboard}
                title={`${currentRound?.name ?? "Round"} Rankings`}
                currentUserId={user?.id}
              />
              <LeaderboardTable
                data={leaderboardTotal}
                title="Overall Rankings"
                currentUserId={user?.id}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color: "emerald" | "rose" | "amber" }) {
  const styles = {
    emerald: "text-emerald-300",
    rose: "text-rose-300",
    amber: "text-amber-300",
  };
  return (
    <div className="flex flex-col items-center py-1">
      <p className={cn("text-2xl font-black leading-none tabular-nums", styles[color])}>{value}</p>
      <p className="text-white/40 text-[10px] font-semibold mt-1">{label}</p>
    </div>
  );
}

function AnswerTally({ answers }: { answers: FifaUserAnswer[] }) {
  const correct = answers.filter((a) => a.isCorrect === true).length;
  const wrong = answers.filter((a) => a.isCorrect === false).length;
  const pending = answers.filter((a) => a.isCorrect == null).length;
  const pts = answers.filter((a) => a.isCorrect === true).reduce((s, a) => s + (a.question?.points ?? 0), 0);
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold flex-shrink-0">
      {correct > 0 && <span className="text-emerald-600">{correct}✓</span>}
      {wrong > 0 && <span className="text-rose-500">{wrong}✗</span>}
      {pending > 0 && <span className="text-amber-500">{pending}⏳</span>}
      {pts > 0 && (
        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
          +{pts}pts
        </span>
      )}
    </div>
  );
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="w-5 h-5 flex-shrink-0 text-amber-400 drop-shadow-[0_1px_4px_rgba(251,191,36,0.7)]" />;
  if (rank === 2) return <Trophy className="w-4 h-4 flex-shrink-0 text-slate-400" />;
  if (rank === 3) return <Trophy className="w-4 h-4 flex-shrink-0 text-amber-700/80" />;
  return (
    <span className="w-5 flex items-center justify-center text-xs font-semibold text-muted-foreground/60 tabular-nums flex-shrink-0">
      {rank}
    </span>
  );
}

function LeaderboardTable({
  data, title, currentUserId,
}: {
  data: FifaLeaderboardEntry[];
  title: string;
  currentUserId?: string;
}) {
  const myEntry = data.find((e) => e.user.id === currentUserId);
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1">{title}</p>

      {/* My position (if outside top 10) */}
      {myEntry && myEntry.rank > 10 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-black text-primary">#{myEntry.rank}</span>
            <span className="text-sm font-semibold">You</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-primary">{myEntry.totalPoints} pts</span>
            {myEntry.distanceToLeader > 0 && (
              <p className="text-[10px] text-muted-foreground">–{myEntry.distanceToLeader} from top</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        {data.length === 0 && (
          <p className="text-center py-8 text-sm text-muted-foreground">No results yet</p>
        )}
        {data.slice(0, 10).map((entry, idx) => {
          const isMe = entry.user.id === currentUserId;
          const isPodium = idx < 3;
          return (
            <div
              key={entry.rank}
              className={cn(
                "flex items-center gap-3 px-4 py-3 border-b last:border-0 transition-colors",
                isMe && "bg-primary/5",
                !isMe && idx === 0 && "bg-gradient-to-r from-yellow-50/80 to-transparent dark:from-yellow-900/10",
                !isMe && idx === 1 && "bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/20",
                !isMe && idx === 2 && "bg-gradient-to-r from-orange-50/60 to-transparent dark:from-orange-900/10",
              )}
            >
              <div className="w-6 flex items-center justify-center flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-semibold leading-none truncate",
                  isMe && "text-primary"
                )}>
                  {isMe ? "You" : getDisplayName({
                    username: entry.user.username,
                    displayName: entry.user.displayName,
                    firstName: entry.user.firstName,
                    lastName: entry.user.lastName,
                  })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                  {entry.correctAnswers}✓&nbsp; {entry.incorrectAnswers}✗&nbsp; {entry.totalAnswers - entry.correctAnswers - entry.incorrectAnswers}⏳
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className={cn(
                  "text-sm font-black tabular-nums",
                  isPodium || isMe ? "text-primary" : "text-foreground"
                )}>
                  {entry.totalPoints}
                </p>
                <p className="text-[10px] text-muted-foreground">pts</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
