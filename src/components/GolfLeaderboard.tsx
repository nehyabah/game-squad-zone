import { useState, useEffect } from "react";
import { golfAPI, GolfTournament, GolfPlayer } from "@/lib/api/golf";
import { getPlayerCountryCode } from "@/lib/golf-player-countries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trophy, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function scoreColor(score: string) {
  if (!score || score === "E") return "text-foreground";
  if (score.startsWith("-")) return "text-red-500";
  if (score.startsWith("+")) return "text-blue-500";
  return "text-foreground";
}

function positionStyle(pos: string) {
  if (pos === "1")               return "bg-amber-400 text-white";
  if (pos === "T2" || pos === "2") return "bg-slate-400 text-white";
  if (pos === "T3" || pos === "3") return "bg-orange-400 text-white";
  return "bg-muted text-muted-foreground";
}

function FlagImg({ playerId, firstName, lastName }: { playerId: string; firstName: string; lastName: string }) {
  const cc = getPlayerCountryCode(playerId, firstName, lastName);
  if (!cc) return <span className="w-[22px] h-[16px] inline-block rounded-sm bg-muted/50 flex-shrink-0" />;
  return (
    <img
      src={`https://flagcdn.com/24x18/${cc}.png`}
      srcSet={`https://flagcdn.com/48x36/${cc}.png 2x`}
      width={22} height={16}
      alt={cc.toUpperCase()}
      className="rounded-sm flex-shrink-0 object-cover"
    />
  );
}

function RoundChip({ label, value }: { label: string; value: string | number | undefined }) {
  if (!value) return null;
  return (
    <span className="flex flex-col items-center">
      <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wide leading-none mb-0.5">{label}</span>
      <span className="text-xs font-medium tabular-nums">{value}</span>
    </span>
  );
}

function MobileRow({ player, idx }: { player: GolfPlayer; idx: number }) {
  const rounds = player.rounds || [];
  const r = (n: number) => rounds.find((r) => r.roundId === n);
  const isCut = player.status === "cut" || player.status === "C";

  return (
    <div className={cn(
      "px-3 py-3 border-b last:border-0",
      idx % 2 === 0 ? "bg-background" : "bg-muted/[0.06]",
      isCut && "opacity-60"
    )}>
      {/* Main row */}
      <div className="flex items-center gap-2.5">
        {/* Position */}
        <span className={cn(
          "text-[10px] font-bold rounded px-1 py-0.5 min-w-[26px] text-center flex-shrink-0",
          positionStyle(player.position)
        )}>
          {player.position}
        </span>

        {/* Flag */}
        <FlagImg playerId={player.playerId} firstName={player.firstName} lastName={player.lastName} />

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate leading-tight">
            {player.firstName[0]}. {player.lastName}
            {isCut && <span className="ml-1.5 text-[10px] font-normal bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">CUT</span>}
          </p>
        </div>

        {/* Score + Thru */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span className={cn("text-base font-black tabular-nums leading-none", scoreColor(player.total))}>
            {player.total}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
            {player.thru !== "F" ? `Thru ${player.thru}` : "Final"}
          </span>
        </div>
      </div>

      {/* Round scores sub-row */}
      {rounds.length > 0 && (
        <div className="flex items-center gap-4 mt-2 pl-[calc(26px+10px+22px+10px)]">
          {/* Today */}
          <span className="flex flex-col items-center">
            <span className="text-[9px] text-muted-foreground/70 uppercase tracking-wide leading-none mb-0.5">Today</span>
            <span className={cn("text-xs font-semibold tabular-nums", scoreColor(player.currentRoundScore))}>
              {player.currentRoundScore}
            </span>
          </span>

          <span className="h-3 w-px bg-border" />

          {/* Individual rounds */}
          {[1, 2, 3, 4].map(n => r(n) ? (
            <RoundChip key={n} label={`R${n}`} value={r(n)!.strokes} />
          ) : null)}
        </div>
      )}
    </div>
  );
}

export default function GolfLeaderboard() {
  const [tournaments, setTournaments] = useState<GolfTournament[]>([]);
  const [selectedTournId, setSelectedTournId] = useState<string>("");
  const [players, setPlayers] = useState<GolfPlayer[]>([]);
  const [tournamentStatus, setTournamentStatus] = useState<string>("");
  const [roundId, setRoundId] = useState<number>(0);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    golfAPI.getSchedule()
      .then((data) => {
        const tourn = data.schedule || [];
        setTournaments(tourn);
        const today = new Date();
        const sorted = [...tourn].sort((a, b) =>
          Math.abs(new Date(a.date.end).getTime() - today.getTime()) -
          Math.abs(new Date(b.date.end).getTime() - today.getTime())
        );
        if (sorted.length > 0) setSelectedTournId(sorted[0].tournId);
      })
      .catch(() => setError("Failed to load tournament schedule"))
      .finally(() => setLoadingSchedule(false));
  }, []);

  useEffect(() => {
    if (!selectedTournId) return;
    setLoadingLeaderboard(true);
    setPlayers([]);
    setError("");
    golfAPI.getLeaderboard(selectedTournId)
      .then((data) => {
        setPlayers(data.leaderboardRows || []);
        setTournamentStatus(data.status || "");
        setRoundId(data.roundId || 0);
      })
      .catch(() => setError("No leaderboard data available for this tournament yet"))
      .finally(() => setLoadingLeaderboard(false));
  }, [selectedTournId]);

  const selectedTournament = tournaments.find((t) => t.tournId === selectedTournId);

  if (loadingSchedule) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
        <span className="text-muted-foreground">Loading tournaments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* Tournament header card */}
      <Card>
        <CardContent className="p-3 sm:p-5">
          {/* Tournament name + status */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <h2 className="text-sm sm:text-base font-bold leading-tight truncate">
                {selectedTournament?.name ?? "Select Tournament"}
              </h2>
            </div>
            {tournamentStatus && (
              <Badge variant="outline" className={cn(
                "text-xs flex-shrink-0",
                tournamentStatus === "Official" && "border-green-500/40 text-green-600 bg-green-500/10",
                tournamentStatus === "In Progress" && "border-blue-500/40 text-blue-600 bg-blue-500/10",
              )}>
                {tournamentStatus}
              </Badge>
            )}
          </div>

          {/* Date + round */}
          {selectedTournament && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
              <Calendar className="w-3 h-3" />
              {formatDate(selectedTournament.date.start)} – {formatDate(selectedTournament.date.end)}
              {roundId > 0 && <><span>·</span><span>Round {roundId}</span></>}
            </p>
          )}

          <Select value={selectedTournId} onValueChange={setSelectedTournId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select tournament" />
            </SelectTrigger>
            <SelectContent className="w-[var(--radix-select-trigger-width)]">
              {tournaments.map((t) => (
                <SelectItem key={t.tournId} value={t.tournId}>
                  {t.name} ({formatDate(t.date.start)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {loadingLeaderboard ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">Loading leaderboard...</span>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-muted-foreground">
              <span className="text-4xl block mb-3">⛳</span>
              <p className="text-sm">{error}</p>
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <span className="text-4xl block mb-3">⛳</span>
              <p className="text-sm">No leaderboard data yet</p>
            </div>
          ) : (
            <>
              {/* ── MOBILE ── */}
              <div className="sm:hidden">
                {/* Column headers */}
                <div className="flex items-center gap-2.5 px-3 py-2 border-b bg-muted/40">
                  <span className="min-w-[26px] text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Pos</span>
                  <span className="flex-1 pl-8 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Player</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
                </div>
                {players.map((player, idx) => (
                  <MobileRow key={player.playerId} player={player} idx={idx} />
                ))}
              </div>

              {/* ── DESKTOP ── */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-3 py-3 font-medium text-muted-foreground w-12">Pos</th>
                      <th className="text-left px-3 py-3 font-medium text-muted-foreground">Player</th>
                      <th className="text-center px-2 py-3 font-medium text-muted-foreground">Total</th>
                      <th className="text-center px-2 py-3 font-medium text-muted-foreground">Today</th>
                      <th className="text-center px-2 py-3 font-medium text-muted-foreground">Thru</th>
                      <th className="text-center px-2 py-3 font-medium text-muted-foreground">R1</th>
                      <th className="text-center px-2 py-3 font-medium text-muted-foreground">R2</th>
                      <th className="text-center px-2 py-3 font-medium text-muted-foreground">R3</th>
                      <th className="text-center px-2 py-3 font-medium text-muted-foreground">R4</th>
                      <th className="text-center px-2 py-3 font-medium text-muted-foreground hidden md:table-cell">Strokes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player, idx) => {
                      const rounds = player.rounds || [];
                      const r = (n: number) => rounds.find((r) => r.roundId === n);
                      return (
                        <tr key={player.playerId} className={cn(
                          "border-b last:border-0 transition-colors hover:bg-muted/20",
                          idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                        )}>
                          <td className="px-3 py-2.5">
                            <span className={cn("inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-semibold min-w-[32px]", positionStyle(player.position))}>
                              {player.position}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-medium">
                            <span className="flex items-center gap-2">
                              <FlagImg playerId={player.playerId} firstName={player.firstName} lastName={player.lastName} />
                              <span>{player.firstName[0]}. {player.lastName}</span>
                              {(player.status === "cut" || player.status === "C") && (
                                <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">CUT</span>
                              )}
                            </span>
                          </td>
                          <td className={cn("px-2 py-2.5 text-center tabular-nums font-bold", scoreColor(player.total))}>{player.total}</td>
                          <td className={cn("px-2 py-2.5 text-center tabular-nums", scoreColor(player.currentRoundScore))}>{player.currentRoundScore}</td>
                          <td className="px-2 py-2.5 text-center text-muted-foreground tabular-nums">{player.thru}</td>
                          <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{r(1)?.strokes ?? "-"}</td>
                          <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{r(2)?.strokes ?? "-"}</td>
                          <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{r(3)?.strokes ?? "-"}</td>
                          <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{r(4)?.strokes ?? "-"}</td>
                          <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground hidden md:table-cell">{player.totalStrokesFromCompletedRounds || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
