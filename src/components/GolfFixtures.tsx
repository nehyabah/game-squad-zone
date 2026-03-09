import { useState, useEffect, useRef } from "react";
import GolfLeaderboard from "./GolfLeaderboard";
import { golfPicksUserAPI, ActiveTournamentResponse, GolfGroupPlayer } from "@/lib/api/golf-picks";
import { getPlayerCountryCode } from "@/lib/golf-player-countries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, CheckCircle2, ChevronLeft, ChevronRight, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const GROUP_LABELS = ["Group 1", "Group 2", "Group 3", "Group 4", "Group 5"];

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

interface GroupCardProps {
  groupNum: number;
  players: GolfGroupPlayer[];
  selectedId: string | undefined;
  isLocked: boolean;
  onSelect: (groupNumber: number, groupPlayerId: string) => void;
}

function GroupCard({ groupNum, players, selectedId, isLocked, onSelect }: GroupCardProps) {
  return (
    <Card>
      <CardContent className="p-2 space-y-1">
        {players.map((player) => {
          const isSelected = selectedId === player.id;
          return (
            <button
              key={player.id}
              onClick={() => onSelect(groupNum, player.id)}
              disabled={isLocked}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors",
                isSelected
                  ? "bg-primary/10 border border-primary/40"
                  : "hover:bg-muted active:bg-muted border border-transparent",
                isLocked ? "cursor-not-allowed opacity-75" : "cursor-pointer"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}
              >
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <FlagImg
                playerId={player.playerId}
                firstName={player.firstName}
                lastName={player.lastName}
              />
              <span className="text-sm font-medium flex-1 min-w-0 truncate">
                {player.firstName} {player.lastName}
              </span>
              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface SwipeableGroupsProps {
  tournament: ActiveTournamentResponse;
  selections: Record<number, string>;
  onSelect: (groupNumber: number, groupPlayerId: string) => void;
}

function SwipeableGroups({ tournament, selections, onSelect }: SwipeableGroupsProps) {
  const groups = [1, 2, 3, 4, 5].filter((n) => (tournament.groups[n] ?? []).length > 0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  function goTo(idx: number) {
    setCurrentIdx(Math.max(0, Math.min(idx, groups.length - 1)));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    // Only swipe if horizontal movement dominates (not a scroll)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 44) {
      if (dx > 0) goTo(currentIdx + 1);
      else goTo(currentIdx - 1);
    }
  }

  const pickedCount = groups.filter((n) => selections[n]).length;

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <span className="text-5xl block mb-3">⛳</span>
        <p className="font-medium">No groups set up yet</p>
        <p className="text-sm mt-1">The admin hasn't added players to any groups.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Pills + nav in one row */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => goTo(currentIdx - 1)}
          disabled={currentIdx === 0}
          className={cn(
            "flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md transition-colors",
            currentIdx === 0
              ? "text-muted-foreground/25 cursor-not-allowed"
              : "text-foreground hover:bg-muted active:bg-muted"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {groups.map((groupNum, idx) => (
          <button
            key={groupNum}
            onClick={() => goTo(idx)}
            className={cn(
              "flex-1 py-1 rounded text-[11px] font-semibold transition-all duration-200 border",
              idx === currentIdx
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : selections[groupNum]
                ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
                : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
            )}
          >
            {selections[groupNum] ? "✓" : `G${groupNum}`}
          </button>
        ))}

        <button
          onClick={() => goTo(currentIdx + 1)}
          disabled={currentIdx === groups.length - 1}
          className={cn(
            "flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md transition-colors",
            currentIdx === groups.length - 1
              ? "text-muted-foreground/25 cursor-not-allowed"
              : "text-foreground hover:bg-muted active:bg-muted"
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Group label + picked status */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-sm font-semibold">{GROUP_LABELS[groups[currentIdx] - 1]}</span>
        <span className="text-xs text-muted-foreground">
          {pickedCount === groups.length
            ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 inline" /> All picked</span>
            : `${pickedCount}/${groups.length} picked`}
        </span>
      </div>

      {/* Swipeable carousel */}
      <div
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIdx * 100}%)` }}
        >
          {groups.map((groupNum) => (
            <div key={groupNum} className="w-full flex-shrink-0">
              <GroupCard
                groupNum={groupNum}
                players={tournament.groups[groupNum]}
                selectedId={selections[groupNum]}
                isLocked={tournament.isLocked}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GolfFixtures() {
  const [tab, setTab] = useState("groups");
  const [tournament, setTournament] = useState<ActiveTournamentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    golfPicksUserAPI
      .getActive()
      .then((data) => {
        setTournament(data);
        const existing: Record<number, string> = {};
        for (const pick of data.myPicks) {
          existing[pick.groupNumber] = pick.groupPlayerId;
        }
        setSelections(existing);
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 404) {
          setGroupsError("No active golf tournament at the moment. Check back soon!");
        } else {
          setGroupsError("Failed to load golf tournament.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(groupNumber: number, groupPlayerId: string) {
    if (tournament?.isLocked) return;
    setSelections((prev) => ({ ...prev, [groupNumber]: groupPlayerId }));
  }

  async function handleSave() {
    if (!tournament) return;
    const picks = Object.entries(selections).map(([group, groupPlayerId]) => ({
      groupNumber: parseInt(group),
      groupPlayerId,
    }));

    if (picks.length === 0) {
      toast({ title: "No picks selected", description: "Select at least one player.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await golfPicksUserAPI.submitPicks(tournament.id, picks);
      toast({ title: "Picks saved!", description: "Your golf picks have been saved." });
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to save picks.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const populatedGroups = tournament
    ? Object.entries(tournament.groups).filter(([, players]) => players.length > 0).length
    : 0;
  const picksCount = Object.keys(selections).length;
  const picksComplete = populatedGroups > 0 && picksCount === populatedGroups;

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="players">All Players</TabsTrigger>
          <TabsTrigger value="groups" className="relative gap-2">
            <Target className="w-3.5 h-3.5 flex-shrink-0" />
            Make Picks
            {/* Remaining picks badge */}
            {populatedGroups > 0 && picksCount < populatedGroups && (
              <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold animate-pulse">
                {populatedGroups - picksCount}
              </span>
            )}
            {/* All done check */}
            {populatedGroups > 0 && picksCount === populatedGroups && (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── ALL PLAYERS TAB ── */}
        <TabsContent value="players" className="mt-4 space-y-4">
          {/* Picks nudge banner */}
          {populatedGroups > 0 && (
            <button
              onClick={() => setTab("groups")}
              className={cn(
                "w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left transition-colors border",
                picksCount === populatedGroups
                  ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/15"
                  : "bg-primary/10 border-primary/20 hover:bg-primary/15 animate-pulse-slow"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{picksCount === populatedGroups ? "✅" : "⛳"}</span>
                <div>
                  <p className="text-sm font-semibold leading-tight">
                    {picksCount === populatedGroups
                      ? "All picks submitted!"
                      : picksCount === 0
                      ? "Make your picks"
                      : `${populatedGroups - picksCount} group${populatedGroups - picksCount > 1 ? "s" : ""} left to pick`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {picksCount === populatedGroups
                      ? "Tap to review your selections"
                      : `Tap to pick from all ${populatedGroups} groups`}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          )}
          <GolfLeaderboard
            tournId={tournament?.tournId ?? ""}
            tournamentName={tournament?.name}
            tournamentDates={tournament ? { start: tournament.startDate, end: tournament.endDate } : undefined}
          />
        </TabsContent>

        {/* ── GROUPS / PICKS TAB ── */}
        <TabsContent value="groups" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading groups…
            </div>
          ) : groupsError ? (
            <div className="text-center py-16 text-muted-foreground">
              <span className="text-5xl block mb-4">⛳</span>
              <p className="text-lg font-medium">{groupsError}</p>
            </div>
          ) : tournament ? (
            <div className="space-y-3 max-w-2xl mx-auto">
              {/* Tournament header — compact single line */}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate leading-tight">{tournament.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tournament.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    {" – "}
                    {new Date(tournament.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                {tournament.isLocked ? (
                  <Badge variant="destructive" className="flex items-center gap-1 flex-shrink-0 text-xs">
                    <Lock className="w-3 h-3" /> Locked
                  </Badge>
                ) : (
                  <Badge className="bg-green-500 text-white flex-shrink-0 text-xs">Open</Badge>
                )}
              </div>

              {tournament.isLocked && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                  Tournament locked — picks can no longer be changed.
                </div>
              )}

              <SwipeableGroups
                tournament={tournament}
                selections={selections}
                onSelect={handleSelect}
              />

              {!tournament.isLocked && (
                <Button
                  className="w-full"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || picksCount === 0}
                >
                  {saving ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving…</>
                  ) : picksComplete ? (
                    "Save All Picks"
                  ) : (
                    `Save Picks (${picksCount}/${populatedGroups})`
                  )}
                </Button>
              )}
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
