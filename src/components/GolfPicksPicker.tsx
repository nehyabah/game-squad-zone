import { useState, useEffect } from "react";
import { golfPicksUserAPI, ActiveTournamentResponse } from "@/lib/api/golf-picks";
import { golfAPI, GolfPlayer, GolfRound } from "@/lib/api/golf";
import { getPlayerCountryCode } from "@/lib/golf-player-countries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Lock, ListChecks, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

function FlagImg({ playerId, firstName, lastName }: { playerId: string; firstName: string; lastName: string }) {
  const cc = getPlayerCountryCode(playerId, firstName, lastName);
  if (!cc) return <span className="w-[22px] h-[16px] inline-block rounded-sm bg-muted/50 flex-shrink-0" />;
  return (
    <img
      src={`https://flagcdn.com/24x18/${cc}.png`}
      srcSet={`https://flagcdn.com/48x36/${cc}.png 2x`}
      width={22}
      height={16}
      alt={cc.toUpperCase()}
      className="rounded-sm flex-shrink-0 object-cover"
    />
  );
}

function scoreColor(score: string | undefined) {
  if (!score || score === "E" || score === "—") return "";
  if (score.startsWith("-")) return "text-red-500";
  if (score.startsWith("+")) return "text-blue-500";
  return "";
}

function positionStyle(pos: string) {
  if (pos === "1") return "bg-amber-400 text-white";
  if (pos === "T2" || pos === "2") return "bg-slate-400 text-white";
  if (pos === "T3" || pos === "3") return "bg-orange-400 text-white";
  return "bg-muted text-muted-foreground";
}

function RoundChip({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined || value === null) return null;
  return (
    <span className="flex flex-col items-center">
      <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wide leading-none mb-0.5">
        {label}
      </span>
      <span className="text-xs font-medium tabular-nums">{value}</span>
    </span>
  );
}

interface PickedPlayer {
  playerId: string;
  firstName: string;
  lastName: string;
  stats: GolfPlayer | null;
}

// ── Player stats dialog ────────────────────────────────────────────────────────
function PlayerStatsDialog({
  player,
  open,
  onClose,
}: {
  player: PickedPlayer | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!player) return null;
  const s = player.stats;
  const rounds = s?.rounds ?? [];
  const r = (n: number): GolfRound | undefined => rounds.find((rnd) => rnd.roundId === n);
  const isCut = s?.status === "cut" || s?.status === "C";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlagImg playerId={player.playerId} firstName={player.firstName} lastName={player.lastName} />
            {player.firstName} {player.lastName}
          </DialogTitle>
        </DialogHeader>

        {!s ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No stats available yet — check back once the tournament begins.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Summary row */}
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Position</p>
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded px-2 py-0.5 text-sm font-bold min-w-[36px]",
                    positionStyle(s.position)
                  )}
                >
                  {s.position}
                </span>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Total</p>
                <span className={cn("text-xl font-black tabular-nums", scoreColor(s.total))}>
                  {s.total}
                </span>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Today</p>
                <span className={cn("text-sm font-semibold tabular-nums", scoreColor(s.currentRoundScore))}>
                  {s.currentRoundScore || "—"}
                </span>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Thru</p>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {s.thru === "F" ? "Final" : s.thru || "—"}
                </span>
              </div>
            </div>

            {isCut && (
              <p className="text-xs text-center text-muted-foreground bg-muted rounded px-2 py-1">
                Player did not make the cut
              </p>
            )}

            {/* Round breakdown */}
            {rounds.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Round Breakdown
                </p>
                <div className="divide-y rounded-lg border overflow-hidden">
                  {[1, 2, 3, 4].map((n) => {
                    const rd = r(n);
                    if (!rd) return null;
                    return (
                      <div key={n} className="flex items-center justify-between px-3 py-2.5 text-sm">
                        <span className="font-medium w-8">R{n}</span>
                        <span className="flex-1 text-xs text-muted-foreground truncate px-2">
                          {rd.courseName}
                        </span>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="tabular-nums text-muted-foreground">{rd.strokes} strokes</span>
                          <span className={cn("tabular-nums font-semibold w-8 text-right", scoreColor(rd.scoreToPar))}>
                            {rd.scoreToPar}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Mobile row ────────────────────────────────────────────────────────────────
function MobilePickRow({ p, idx, hasStats, onClick }: { p: PickedPlayer; idx: number; hasStats: boolean; onClick: () => void }) {
  const s = p.stats;
  const rounds = s?.rounds ?? [];
  const r = (n: number): GolfRound | undefined => rounds.find((rnd) => rnd.roundId === n);
  const isCut = s?.status === "cut" || s?.status === "C";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 border-b last:border-0 active:bg-muted/30 transition-colors",
        idx % 2 === 0 ? "bg-background" : "bg-muted/[0.06]",
        isCut && "opacity-60"
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-2.5">
        {/* Position badge — only when stats available */}
        {hasStats && (
          <span
            className={cn(
              "text-[10px] font-bold rounded px-1 py-0.5 min-w-[28px] text-center flex-shrink-0",
              s ? positionStyle(s.position) : "bg-muted text-muted-foreground"
            )}
          >
            {s?.position ?? "—"}
          </span>
        )}

        <FlagImg playerId={p.playerId} firstName={p.firstName} lastName={p.lastName} />

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate leading-tight">
            {p.firstName ? `${p.firstName[0]}. ` : ""}
            {p.lastName}
            {isCut && (
              <span className="ml-1.5 text-[10px] font-normal bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                CUT
              </span>
            )}
          </p>
        </div>

        {/* Total + Thru */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span className={cn("text-base font-black tabular-nums leading-none", scoreColor(s?.total))}>
            {s?.total ?? "—"}
          </span>
          {s && (
            <span className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
              {s.thru === "F" ? "Final" : s.thru ? `Thru ${s.thru}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Round scores sub-row — always shown when stats exist */}
      {hasStats && (
        <div
          className={cn(
            "flex items-center gap-3 mt-2",
            hasStats
              ? "pl-[calc(28px+10px+22px+10px)]"
              : "pl-[calc(22px+10px)]"
          )}
        >
          {/* Today */}
          {s?.currentRoundScore && (
            <>
              <span className="flex flex-col items-center">
                <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wide leading-none mb-0.5">
                  Today
                </span>
                <span className={cn("text-xs font-semibold tabular-nums", scoreColor(s.currentRoundScore))}>
                  {s.currentRoundScore}
                </span>
              </span>
              <span className="h-3 w-px bg-border" />
            </>
          )}

          {[1, 2, 3, 4].map((n) => (
            <RoundChip key={n} label={`R${n}`} value={r(n)?.strokes ?? "—"} />
          ))}
        </div>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GolfPicksPicker() {
  const [tournament, setTournament] = useState<ActiveTournamentResponse | null>(null);
  const [pickedPlayers, setPickedPlayers] = useState<PickedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PickedPlayer | null>(null);

  useEffect(() => {
    golfPicksUserAPI
      .getActive()
      .then(async (data) => {
        setTournament(data);

        if (data.myPicks.length === 0) return;

        const picks: PickedPlayer[] = data.myPicks.map((pick) => {
          const players = data.groups[pick.groupNumber] ?? [];
          const groupPlayer = players.find((p) => p.id === pick.groupPlayerId);
          return {
            playerId: groupPlayer?.playerId ?? "",
            firstName: groupPlayer?.firstName ?? "",
            lastName: groupPlayer?.lastName ?? "",
            stats: null,
          };
        });

        try {
          const lb = await golfAPI.getLeaderboard(data.tournId);
          const statsMap = new Map(lb.leaderboardRows.map((p) => [p.playerId, p]));
          picks.forEach((p) => {
            if (p.playerId) p.stats = statsMap.get(p.playerId) ?? null;
          });
        } catch {
          // Leaderboard not available yet — show names only
        }

        setPickedPlayers(picks);
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 404) {
          setError("No active golf tournament at the moment. Check back soon!");
        } else {
          setError("Failed to load golf tournament.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading picks…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <span className="text-6xl block mb-4">⛳</span>
        <p className="text-lg font-medium">{error}</p>
      </div>
    );
  }

  if (!tournament) return null;

  const hasStats = pickedPlayers.some((p) => p.stats !== null);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <PlayerStatsDialog
        player={selectedPlayer}
        open={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
      {/* Tournament header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{tournament.name}</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(tournament.startDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}{" "}
            –{" "}
            {new Date(tournament.endDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        {tournament.isLocked ? (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Locked
          </Badge>
        ) : (
          <Badge className="bg-green-500 text-white">Open</Badge>
        )}
      </div>

      {pickedPlayers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ListChecks className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No picks yet</p>
          <p className="text-sm mt-1">
            Head to{" "}
            <span className="font-medium text-foreground">Fixtures → Groups</span>{" "}
            to make your picks.
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">

            {/* ── MOBILE ── */}
            <div className="sm:hidden">
              <div className="flex items-center gap-2.5 px-3 py-2 border-b bg-muted/40">
                {hasStats && (
                  <span className="min-w-[28px] text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                    Pos
                  </span>
                )}
                <span className={cn(
                  "flex-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
                  hasStats ? "pl-8" : "pl-0"
                )}>
                  Player
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total
                </span>
              </div>
              {pickedPlayers.map((p, idx) => (
                <MobilePickRow key={p.playerId || idx} p={p} idx={idx} hasStats={hasStats} onClick={() => setSelectedPlayer(p)} />
              ))}
            </div>

            {/* ── DESKTOP ── */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    {hasStats && (
                      <th className="text-left px-3 py-3 font-medium text-muted-foreground w-12">Pos</th>
                    )}
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Player</th>
                    <th className="text-center px-2 py-3 font-medium text-muted-foreground">Total</th>
                    {hasStats && (
                      <>
                        <th className="text-center px-2 py-3 font-medium text-muted-foreground">Today</th>
                        <th className="text-center px-2 py-3 font-medium text-muted-foreground">Thru</th>
                      </>
                    )}
                    <th className="text-center px-2 py-3 font-medium text-muted-foreground">R1</th>
                    <th className="text-center px-2 py-3 font-medium text-muted-foreground">R2</th>
                    <th className="text-center px-2 py-3 font-medium text-muted-foreground">R3</th>
                    <th className="text-center px-2 py-3 font-medium text-muted-foreground">R4</th>
                  </tr>
                </thead>
                <tbody>
                  {pickedPlayers.map((p, idx) => {
                    const s = p.stats;
                    const rounds = s?.rounds ?? [];
                    const r = (n: number): GolfRound | undefined =>
                      rounds.find((rnd) => rnd.roundId === n);
                    const isCut = s?.status === "cut" || s?.status === "C";

                    return (
                      <tr
                        key={p.playerId || idx}
                        onClick={() => setSelectedPlayer(p)}
                        className={cn(
                          "border-b last:border-0 transition-colors hover:bg-muted/20 cursor-pointer",
                          idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                          isCut && "opacity-60"
                        )}
                      >
                        {hasStats && (
                          <td className="px-3 py-2.5">
                            {s ? (
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-semibold min-w-[32px]",
                                  positionStyle(s.position)
                                )}
                              >
                                {s.position}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        )}

                        <td className="px-3 py-2.5 font-medium">
                          <span className="flex items-center gap-2">
                            <FlagImg
                              playerId={p.playerId}
                              firstName={p.firstName}
                              lastName={p.lastName}
                            />
                            <span>
                              {p.firstName ? `${p.firstName[0]}. ` : ""}
                              {p.lastName}
                            </span>
                            {isCut && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                CUT
                              </span>
                            )}
                          </span>
                        </td>

                        <td className={cn("px-2 py-2.5 text-center tabular-nums font-bold", scoreColor(s?.total))}>
                          {s?.total ?? "—"}
                        </td>

                        {hasStats && (
                          <>
                            <td className={cn("px-2 py-2.5 text-center tabular-nums", scoreColor(s?.currentRoundScore))}>
                              {s?.currentRoundScore ?? "—"}
                            </td>
                            <td className="px-2 py-2.5 text-center text-muted-foreground tabular-nums">
                              {s?.thru ?? "—"}
                            </td>
                          </>
                        )}

                        <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">
                          {r(1)?.strokes ?? "—"}
                        </td>
                        <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">
                          {r(2)?.strokes ?? "—"}
                        </td>
                        <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">
                          {r(3)?.strokes ?? "—"}
                        </td>
                        <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">
                          {r(4)?.strokes ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
}
