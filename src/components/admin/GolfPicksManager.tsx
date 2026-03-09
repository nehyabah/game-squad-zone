import { useState, useEffect, useCallback, useRef } from "react";
import { golfPicksAdminAPI, GolfTournamentSetup, GolfGroupPlayer } from "@/lib/api/golf-picks";
import { golfAPI, GolfTournament, GolfPlayer } from "@/lib/api/golf";
import { getPlayerCountryCode } from "@/lib/golf-player-countries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Lock, Unlock, Plus, Trash2, Trophy, Zap, Search, Users,
  CheckCircle2, AlertCircle, UserPlus,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const GROUP_LABELS = ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5"];

function FlagImg({ playerId, firstName, lastName }: { playerId: string; firstName: string; lastName: string }) {
  const cc = getPlayerCountryCode(playerId, firstName, lastName);
  if (!cc) return <span className="w-[18px] h-[13px] inline-block rounded-sm bg-muted/50 flex-shrink-0" />;
  return (
    <img
      src={`https://flagcdn.com/24x18/${cc}.png`}
      srcSet={`https://flagcdn.com/48x36/${cc}.png 2x`}
      width={18} height={13}
      alt={cc.toUpperCase()}
      className="rounded-sm flex-shrink-0 object-cover"
    />
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Assign Players Sheet ─────────────────────────────────────────────────────
interface AssignSheetProps {
  open: boolean;
  onClose: () => void;
  activeTournament: GolfTournamentSetup;
  groups: Record<number, GolfGroupPlayer[]>;
  onGroupsChange: () => void;
}

function AssignPlayersSheet({ open, onClose, activeTournament, groups, onGroupsChange }: AssignSheetProps) {
  const [selectedGroup, setSelectedGroup] = useState(1);
  const [search, setSearch] = useState("");
  const [leaderboard, setLeaderboard] = useState<GolfPlayer[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [noLeaderboard, setNoLeaderboard] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  // Manual entry
  const [showManual, setShowManual] = useState(false);
  const [manualFirst, setManualFirst] = useState("");
  const [manualLast, setManualLast] = useState("");
  const [manualId, setManualId] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // All assigned player IDs across all groups
  const assignedIds = Object.values(groups).flat().map((p) => p.playerId);
  // Players in the currently selected group
  const currentGroupPlayers = groups[selectedGroup] ?? [];

  useEffect(() => {
    if (!open || !activeTournament) return;
    setLeaderboardLoading(true);
    setNoLeaderboard(false);
    golfAPI
      .getLeaderboard(activeTournament.tournId, activeTournament.year)
      .then((res) => setLeaderboard(res.leaderboardRows ?? []))
      .catch(() => setNoLeaderboard(true))
      .finally(() => setLeaderboardLoading(false));
  }, [open, activeTournament]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 100);
  }, [open]);

  const filtered = leaderboard.filter((p) => {
    const q = search.toLowerCase();
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q);
  });

  async function handleAdd(player: GolfPlayer) {
    setAdding(player.playerId);
    try {
      const added = await golfPicksAdminAPI.addPlayer(
        activeTournament.id, selectedGroup,
        player.playerId, player.firstName, player.lastName
      );
      toast({ title: "Player added", description: `${player.firstName} ${player.lastName} → Group ${selectedGroup}` });
      onGroupsChange();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to add player";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setAdding(null);
    }
  }

  async function handleRemoveFromGroup(gp: GolfGroupPlayer) {
    setRemoving(gp.id);
    try {
      await golfPicksAdminAPI.removePlayer(activeTournament.id, gp.id);
      toast({ title: "Player removed", description: `${gp.firstName} ${gp.lastName} removed` });
      onGroupsChange();
    } catch {
      toast({ title: "Error", description: "Failed to remove player", variant: "destructive" });
    } finally {
      setRemoving(null);
    }
  }

  async function handleManualAdd() {
    if (!manualFirst.trim() || !manualLast.trim()) return;
    setManualSaving(true);
    try {
      await golfPicksAdminAPI.addPlayer(
        activeTournament.id, selectedGroup,
        manualId.trim() || `manual-${Date.now()}`,
        manualFirst.trim(), manualLast.trim()
      );
      toast({ title: "Player added", description: `${manualFirst} ${manualLast} → Group ${selectedGroup}` });
      setManualFirst(""); setManualLast(""); setManualId("");
      onGroupsChange();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to add player";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setManualSaving(false);
    }
  }

  function getPlayerGroup(playerId: string): number | null {
    for (const [num, players] of Object.entries(groups)) {
      if (players.some((p) => p.playerId === playerId)) return Number(num);
    }
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-primary" />
            Assign Players — {activeTournament.name}
          </SheetTitle>

          {/* Group pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {[1, 2, 3, 4, 5].map((g) => {
              const count = (groups[g] ?? []).length;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGroup(g)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all",
                    selectedGroup === g
                      ? "bg-primary text-primary-foreground border-primary"
                      : count > 0
                      ? "bg-green-500/10 text-green-700 border-green-500/30 hover:bg-green-500/20"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                  )}
                >
                  G{g}
                  {count > 0 && (
                    <span className={cn(
                      "inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold",
                      selectedGroup === g ? "bg-white/20 text-white" : "bg-green-500 text-white"
                    )}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Current group members */}
          {currentGroupPlayers.length > 0 && (
            <div className="px-4 py-3 border-b bg-muted/20">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {GROUP_LABELS[selectedGroup - 1]} ({currentGroupPlayers.length} players)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {currentGroupPlayers.map((gp) => (
                  <span
                    key={gp.id}
                    className="inline-flex items-center gap-1 bg-background border rounded-full pl-1.5 pr-1 py-0.5 text-xs"
                  >
                    <FlagImg playerId={gp.playerId} firstName={gp.firstName} lastName={gp.lastName} />
                    <span className="font-medium">{gp.firstName[0]}. {gp.lastName}</span>
                    <button
                      onClick={() => handleRemoveFromGroup(gp)}
                      disabled={removing === gp.id}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      {removing === gp.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Trash2 className="w-3 h-3" />}
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Player pool */}
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder="Search players…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs"
                onClick={() => setShowManual((v) => !v)}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Manual
              </Button>
            </div>

            {/* Manual entry */}
            {showManual && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Add player manually</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="First name" value={manualFirst} onChange={(e) => setManualFirst(e.target.value)} className="h-8 text-sm" />
                  <Input placeholder="Last name" value={manualLast} onChange={(e) => setManualLast(e.target.value)} className="h-8 text-sm" />
                </div>
                <Input placeholder="Player ID (optional)" value={manualId} onChange={(e) => setManualId(e.target.value)} className="h-8 text-sm" />
                <Button
                  size="sm"
                  className="w-full h-8 text-xs gap-1"
                  disabled={!manualFirst.trim() || !manualLast.trim() || manualSaving}
                  onClick={handleManualAdd}
                >
                  {manualSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add to {GROUP_LABELS[selectedGroup - 1]}
                </Button>
              </div>
            )}

            {leaderboardLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading players…
              </div>
            ) : noLeaderboard ? (
              <div className="text-center py-8 text-muted-foreground space-y-1">
                <AlertCircle className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-sm font-medium">No leaderboard available yet</p>
                <p className="text-xs">Use manual entry above to add players before the tournament starts.</p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No players match "{search}"</p>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((player) => {
                  const inGroup = getPlayerGroup(player.playerId);
                  const inCurrentGroup = inGroup === selectedGroup;
                  const inOtherGroup = inGroup !== null && inGroup !== selectedGroup;
                  const isAdding = adding === player.playerId;

                  return (
                    <button
                      key={player.playerId}
                      disabled={inOtherGroup || isAdding}
                      onClick={() => !inOtherGroup && !inCurrentGroup && handleAdd(player)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors",
                        inCurrentGroup
                          ? "bg-green-500/10 border border-green-500/30 cursor-default"
                          : inOtherGroup
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-muted active:bg-muted cursor-pointer border border-transparent"
                      )}
                    >
                      {/* Position */}
                      <span className="text-[10px] text-muted-foreground w-6 text-right flex-shrink-0 tabular-nums">
                        {player.position}
                      </span>

                      <FlagImg playerId={player.playerId} firstName={player.firstName} lastName={player.lastName} />

                      <span className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">
                          {player.firstName} {player.lastName}
                        </span>
                      </span>

                      <span className={cn(
                        "text-xs tabular-nums flex-shrink-0",
                        player.total?.startsWith("-") ? "text-red-500" : player.total?.startsWith("+") ? "text-blue-500" : "text-muted-foreground"
                      )}>
                        {player.total}
                      </span>

                      {/* Status indicator */}
                      <span className="flex-shrink-0 w-16 text-right">
                        {isAdding ? (
                          <Loader2 className="w-4 h-4 animate-spin inline" />
                        ) : inCurrentGroup ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Added
                          </span>
                        ) : inOtherGroup ? (
                          <span className="text-[10px] text-muted-foreground">G{inGroup}</span>
                        ) : (
                          <span className="text-[10px] text-primary font-medium">+ Add</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function GolfPicksManager() {
  const [tab, setTab] = useState("tournament");

  // Tournament tab state
  const [schedule, setSchedule] = useState<GolfTournament[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [selectedTournId, setSelectedTournId] = useState("");
  const [activating, setActivating] = useState(false);
  const [tournaments, setTournaments] = useState<GolfTournamentSetup[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [settingActiveId, setSettingActiveId] = useState<string | null>(null);

  // Groups tab state
  const [activeTournament, setActiveTournament] = useState<GolfTournamentSetup | null>(null);
  const [groups, setGroups] = useState<Record<number, GolfGroupPlayer[]>>({});
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const loadTournaments = useCallback(async () => {
    setTournamentsLoading(true);
    try {
      const data = await golfPicksAdminAPI.getAllTournaments();
      setTournaments(data);
      const active = data.find((t) => t.isActive) ?? null;
      setActiveTournament(active);
    } catch {
      toast({ title: "Error", description: "Failed to load tournaments", variant: "destructive" });
    } finally {
      setTournamentsLoading(false);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    if (!activeTournament) return;
    setGroupsLoading(true);
    try {
      const { golfPicksUserAPI } = await import("@/lib/api/golf-picks");
      const data = await golfPicksUserAPI.getActive();
      setGroups(data.groups as Record<number, GolfGroupPlayer[]>);
    } catch {
      setGroups({});
    } finally {
      setGroupsLoading(false);
    }
  }, [activeTournament]);

  useEffect(() => { loadTournaments(); }, [loadTournaments]);

  useEffect(() => {
    if (tab === "groups" && activeTournament) loadGroups();
  }, [tab, activeTournament, loadGroups]);

  useEffect(() => {
    if (tab === "tournament" && schedule.length === 0) {
      setScheduleLoading(true);
      golfAPI.getSchedule()
        .then((res) => {
          const sorted = [...(res.schedule ?? [])].sort((a, b) => {
            const now = Date.now();
            return Math.abs(new Date(a.date.end).getTime() - now) - Math.abs(new Date(b.date.end).getTime() - now);
          });
          setSchedule(sorted);
          if (sorted.length > 0 && !selectedTournId) setSelectedTournId(sorted[0].tournId);
        })
        .catch(() => toast({ title: "Error", description: "Failed to load schedule", variant: "destructive" }))
        .finally(() => setScheduleLoading(false));
    }
  }, [tab]);

  async function handleActivate() {
    if (!selectedTournId) return;
    const tourn = schedule.find((t) => t.tournId === selectedTournId);
    if (!tourn) return;
    setActivating(true);
    try {
      await golfPicksAdminAPI.createTournament({
        tournId: tourn.tournId,
        year: new Date().getFullYear(),
        name: tourn.name,
        startDate: tourn.date.start,
        endDate: tourn.date.end,
      });
      toast({ title: "Tournament activated", description: tourn.name });
      await loadTournaments();
    } catch {
      toast({ title: "Error", description: "Failed to activate tournament", variant: "destructive" });
    } finally {
      setActivating(false);
    }
  }

  async function handleToggleLock(id: string) {
    try {
      const updated = await golfPicksAdminAPI.toggleLock(id);
      setTournaments((prev) => prev.map((t) => t.id === id ? { ...t, isLocked: updated.isLocked } : t));
      if (activeTournament?.id === id) setActiveTournament((prev) => prev ? { ...prev, isLocked: updated.isLocked } : prev);
      toast({
        title: updated.isLocked ? "Tournament locked" : "Tournament unlocked",
        description: updated.isLocked ? "Users can no longer change picks." : "Users can now make picks.",
      });
    } catch {
      toast({ title: "Error", description: "Failed to toggle lock", variant: "destructive" });
    }
  }

  async function handleSetActive(t: GolfTournamentSetup) {
    if (t.isActive) return;
    setSettingActiveId(t.id);
    try {
      const updated = await golfPicksAdminAPI.setActive(t.id);
      setTournaments((prev) => prev.map((x) => ({ ...x, isActive: x.id === t.id })));
      setActiveTournament(updated);
      toast({ title: "Tournament activated", description: updated.name });
    } catch {
      toast({ title: "Error", description: "Failed to activate tournament", variant: "destructive" });
    } finally {
      setSettingActiveId(null);
    }
  }

  async function handleRemovePlayer(groupPlayerId: string) {
    setRemoving(groupPlayerId);
    try {
      await golfPicksAdminAPI.removePlayer(activeTournament!.id, groupPlayerId);
      toast({ title: "Player removed" });
      await loadGroups();
    } catch {
      toast({ title: "Error", description: "Failed to remove player", variant: "destructive" });
    } finally {
      setRemoving(null);
    }
  }

  const totalPlayers = Object.values(groups).flat().length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Golf Picks Manager</h2>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tournament">Tournament</TabsTrigger>
          <TabsTrigger value="groups" disabled={!activeTournament}>
            Groups {activeTournament ? `(${totalPlayers})` : "(no active)"}
          </TabsTrigger>
        </TabsList>

        {/* ── TOURNAMENT TAB ── */}
        <TabsContent value="tournament" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activate Tournament</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scheduleLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading schedule…
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Select value={selectedTournId} onValueChange={setSelectedTournId}>
                      <SelectTrigger className="w-full sm:w-96">
                        <SelectValue placeholder="Select tournament…" />
                      </SelectTrigger>
                      <SelectContent>
                        {schedule.map((t) => (
                          <SelectItem key={t.tournId} value={t.tournId}>
                            {t.name} · {formatDate(t.date.start)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleActivate} disabled={!selectedTournId || activating}>
                      {activating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Activate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Activating a tournament deactivates the current one. Existing groups and picks are preserved on the old record.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Tournaments</CardTitle>
            </CardHeader>
            <CardContent>
              {tournamentsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : tournaments.length === 0 ? (
                <p className="text-muted-foreground text-sm">No tournaments yet.</p>
              ) : (
                <div className="space-y-2">
                  {tournaments.map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        "flex items-start justify-between border rounded-lg px-4 py-3 gap-3",
                        t.isActive && "border-green-500/40 bg-green-500/5"
                      )}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{t.name}</span>
                          {t.isActive && <Badge className="bg-green-500 text-white text-xs">Active</Badge>}
                          {t.isLocked && <Badge variant="destructive" className="text-xs">Locked</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(t.startDate)} – {formatDate(t.endDate)} ·{" "}
                          {t._count?.groups ?? 0} players · {t._count?.picks ?? 0} picks
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!t.isActive && (
                          <Button
                            size="sm" variant="outline"
                            onClick={() => handleSetActive(t)}
                            disabled={settingActiveId === t.id}
                            className="gap-1 text-green-700 border-green-500/40 hover:bg-green-500/10"
                          >
                            {settingActiveId === t.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Zap className="w-3.5 h-3.5" />}
                            Activate
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleToggleLock(t.id)} className="gap-1">
                          {t.isLocked
                            ? <><Unlock className="w-3.5 h-3.5" /> Unlock</>
                            : <><Lock className="w-3.5 h-3.5" /> Lock</>}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── GROUPS TAB ── */}
        <TabsContent value="groups" className="mt-4">
          {!activeTournament ? (
            <p className="text-muted-foreground">No active tournament. Activate one first.</p>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-lg">{activeTournament.name}</span>
                  {activeTournament.isLocked
                    ? <Badge variant="destructive">Locked</Badge>
                    : <Badge className="bg-green-500 text-white">Open</Badge>}
                </div>
                <Button
                  onClick={() => setAssignSheetOpen(true)}
                  className="gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Assign Players
                </Button>
              </div>

              {groupsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading groups…
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((groupNum) => {
                    const players = groups[groupNum] ?? [];
                    return (
                      <Card key={groupNum} className={cn(players.length === 0 && "border-dashed")}>
                        <CardHeader className="pb-2 pt-3 px-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">
                              {GROUP_LABELS[groupNum - 1]}
                            </CardTitle>
                            <Badge
                              variant={players.length > 0 ? "default" : "outline"}
                              className={cn(
                                "text-xs h-5 px-1.5",
                                players.length > 0 ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground"
                              )}
                            >
                              {players.length}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-3 space-y-1">
                          {players.length === 0 ? (
                            <button
                              onClick={() => setAssignSheetOpen(true)}
                              className="w-full flex flex-col items-center justify-center py-4 rounded-md border border-dashed text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="text-xs">Add players</span>
                            </button>
                          ) : (
                            players.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center gap-1.5 text-sm py-1 border-b last:border-0 group"
                              >
                                <FlagImg playerId={p.playerId} firstName={p.firstName} lastName={p.lastName} />
                                <span className="flex-1 min-w-0 truncate font-medium text-xs">
                                  {p.firstName[0]}. {p.lastName}
                                </span>
                                <button
                                  onClick={() => handleRemovePlayer(p.id)}
                                  disabled={removing === p.id}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                >
                                  {removing === p.id
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <Trash2 className="w-3 h-3" />}
                                </button>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Assign Players Sheet */}
      {activeTournament && (
        <AssignPlayersSheet
          open={assignSheetOpen}
          onClose={() => setAssignSheetOpen(false)}
          activeTournament={activeTournament}
          groups={groups}
          onGroupsChange={loadGroups}
        />
      )}
    </div>
  );
}
