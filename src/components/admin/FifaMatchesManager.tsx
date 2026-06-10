import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fifaMatchesAPI, FifaRound, FifaMatch } from "@/lib/api/fifa";
import { FifaTeamFlag } from "@/lib/utils/fifa";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  rounds: FifaRound[];
  matches: FifaMatch[];
  onRefresh?: () => void;
}

const GROUP_NAMES = [
  "Group A", "Group B", "Group C", "Group D", "Group E", "Group F",
  "Group G", "Group H", "Group I", "Group J", "Group K", "Group L",
];

const BLANK_MATCH = { roundId: "", matchNumber: 1, homeTeam: "", awayTeam: "", matchDate: "", venue: "" };
const BLANK_GROUP = { roundId: "", matchNumber: 1, groupName: "Group A", matchDate: "", teams: ["", "", "", ""] };

const ROUND_SHORT: Record<number, string> = {
  0: "Predictions", 1: "Groups", 2: "R32", 3: "R16", 4: "QF", 5: "SF", 6: "Final",
};

export default function FifaMatchesManager({ rounds, matches, onRefresh }: Props) {
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [isMatchOpen, setIsMatchOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<FifaMatch | null>(null);
  const [scoreMatch, setScoreMatch] = useState<FifaMatch | null>(null);
  const [newMatch, setNewMatch] = useState(BLANK_MATCH);
  const [newGroup, setNewGroup] = useState(BLANK_GROUP);
  const [scoreData, setScoreData] = useState({ homeScore: 0, awayScore: 0 });
  const { toast } = useToast();

  useEffect(() => {
    if (rounds.length > 0 && !selectedRoundId) {
      setSelectedRoundId(rounds[0].id);
    }
  }, [rounds]);

  const selectedRound = rounds.find((r) => r.id === selectedRoundId);
  const roundMatches = matches.filter((m) => m.roundId === selectedRoundId);
  const isRound0 = selectedRound?.roundNumber === 0;
  const isRound1 = selectedRound?.roundNumber === 1;

  const matchCountForRound = (roundId: string) => matches.filter((m) => m.roundId === roundId).length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateMatch = async () => {
    try {
      await fifaMatchesAPI.create({
        ...newMatch,
        matchDate: new Date(newMatch.matchDate).toISOString(),
        venue: newMatch.venue || undefined,
      });
      setIsMatchOpen(false);
      setNewMatch(BLANK_MATCH);
      toast({ title: "Match created" });
      onRefresh?.();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to create match", variant: "destructive" });
    }
  };

  const handleCreateGroup = async () => {
    const teams = newGroup.teams.filter((t) => t.trim() !== "");
    if (teams.length < 2) {
      toast({ title: "Error", description: "Add at least 2 teams", variant: "destructive" });
      return;
    }
    try {
      await fifaMatchesAPI.create({
        roundId: selectedRoundId,
        matchNumber: newGroup.matchNumber,
        homeTeam: newGroup.groupName,
        awayTeam: "",
        matchDate: new Date(newGroup.matchDate).toISOString(),
        groupTeams: teams,
      });
      setIsGroupOpen(false);
      setNewGroup(BLANK_GROUP);
      toast({ title: `${newGroup.groupName} created` });
      onRefresh?.();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to create group", variant: "destructive" });
    }
  };

  const handleCreateRound0 = async () => {
    if (!selectedRound) return;
    const existing = matches.find((m) => m.roundId === selectedRound.id);
    if (existing) {
      toast({ title: "Already exists", description: "Tournament Predictions entry already created." });
      return;
    }
    try {
      await fifaMatchesAPI.create({
        roundId: selectedRound.id,
        matchNumber: 1,
        homeTeam: "Tournament Predictions",
        awayTeam: "",
        matchDate: selectedRound.lockTime ?? new Date().toISOString(),
      });
      toast({ title: "Predictions entry created — now add questions" });
      onRefresh?.();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!editMatch) return;
    try {
      await fifaMatchesAPI.update(editMatch.id, {
        matchNumber: editMatch.matchNumber,
        homeTeam: editMatch.homeTeam,
        awayTeam: editMatch.awayTeam,
        matchDate: new Date(editMatch.matchDate).toISOString(),
        venue: editMatch.venue || undefined,
        groupTeams: editMatch.groupTeams ?? undefined,
      });
      setEditMatch(null);
      toast({ title: "Updated" });
      onRefresh?.();
    } catch {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this match and all its questions?")) return;
    try {
      await fifaMatchesAPI.delete(id);
      toast({ title: "Deleted" });
      onRefresh?.();
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleScore = async () => {
    if (!scoreMatch) return;
    try {
      await fifaMatchesAPI.updateScore(scoreMatch.id, scoreData.homeScore, scoreData.awayScore);
      setScoreMatch(null);
      toast({ title: "Score updated" });
      onRefresh?.();
    } catch {
      toast({ title: "Error", description: "Failed to update score", variant: "destructive" });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">Matches</h3>
          <p className="text-xs text-muted-foreground">Select a round to view and manage its matches</p>
        </div>
        {selectedRound && (
          <>
            {isRound0 && !roundMatches.length && (
              <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={handleCreateRound0}>
                <Plus className="w-3.5 h-3.5" /> Set Up
              </Button>
            )}
            {isRound1 && (
              <Button size="sm" className="gap-1.5 h-8" onClick={() => { setNewGroup(BLANK_GROUP); setIsGroupOpen(true); }}>
                <Plus className="w-3.5 h-3.5" /> Add Group
              </Button>
            )}
            {!isRound0 && !isRound1 && (
              <Button size="sm" className="gap-1.5 h-8" onClick={() => { setNewMatch({ ...BLANK_MATCH, roundId: selectedRoundId, matchNumber: roundMatches.length + 1 }); setIsMatchOpen(true); }}>
                <Plus className="w-3.5 h-3.5" /> Add Match
              </Button>
            )}
          </>
        )}
      </div>

      {/* ── Round tabs ────────────────────────────────────────────────────── */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}
      >
        {[...rounds].sort((a, b) => a.roundNumber - b.roundNumber).map((round) => {
          const count = matchCountForRound(round.id);
          const isSel = round.id === selectedRoundId;
          const isLocked = round.isLocked || (!!round.lockTime && new Date() >= new Date(round.lockTime));
          return (
            <button
              key={round.id}
              onClick={() => setSelectedRoundId(round.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border whitespace-nowrap",
                isSel
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
              )}
            >
              <span className={cn(
                "text-[9px] font-black rounded px-1 py-0.5 leading-none",
                isSel ? "bg-white/20 text-white" : "bg-muted-foreground/15 text-muted-foreground"
              )}>
                R{round.roundNumber}
              </span>
              <span className="hidden sm:inline">{round.name}</span>
              <span className="sm:hidden">{ROUND_SHORT[round.roundNumber] ?? round.name}</span>
              {count > 0 && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                  isSel ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                )}>
                  {count}
                </span>
              )}
              {isLocked && !isSel && <Lock className="w-2.5 h-2.5 opacity-40 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* ── Round info strip ──────────────────────────────────────────────── */}
      {selectedRound && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{selectedRound.name}</span>
            {selectedRound.isActive && (
              <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5 text-[10px]">
                <span className="w-1 h-1 rounded-full bg-emerald-500" /> OPEN
              </span>
            )}
            {(selectedRound.isLocked || (selectedRound.lockTime && new Date() >= new Date(selectedRound.lockTime))) && (
              <span className="flex items-center gap-1 text-muted-foreground font-bold bg-muted border border-border rounded-full px-1.5 py-0.5 text-[10px]">
                <Lock className="w-2 h-2" /> LOCKED
              </span>
            )}
          </div>
          <span className="text-muted-foreground">
            {selectedRound.pointsPerQuestion} pts/question · {roundMatches.length} {isRound1 ? "group" : "match"}{roundMatches.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {!selectedRound ? null : roundMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center rounded-xl border border-dashed border-border">
          <p className="font-semibold text-sm">
            {isRound0 ? "No entry yet" : isRound1 ? "No groups yet" : "No matches yet"}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            {isRound0
              ? "Click Set Up to create the Tournament Predictions entry."
              : isRound1
                ? "Add all 12 groups (A–L) with 4 teams each."
                : `Add matches once the ${selectedRound.name} fixtures are confirmed.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {roundMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={{ ...match, round: selectedRound }}
              onEdit={() => setEditMatch(match)}
              onDelete={() => handleDelete(match.id)}
              onScore={() => { setScoreMatch(match); setScoreData({ homeScore: match.homeScore ?? 0, awayScore: match.awayScore ?? 0 }); }}
            />
          ))}
        </div>
      )}

      {/* ── Add Match Dialog (R2-6) ───────────────────────────────────────── */}
      <Dialog open={isMatchOpen} onOpenChange={setIsMatchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Match — {selectedRound?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Match Number</Label>
              <Input type="number" min={1} value={newMatch.matchNumber}
                onChange={(e) => setNewMatch({ ...newMatch, matchNumber: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Home Team</Label>
                <Input placeholder="e.g. Brazil" value={newMatch.homeTeam}
                  onChange={(e) => setNewMatch({ ...newMatch, homeTeam: e.target.value })} />
              </div>
              <div>
                <Label>Away Team</Label>
                <Input placeholder="e.g. Argentina" value={newMatch.awayTeam}
                  onChange={(e) => setNewMatch({ ...newMatch, awayTeam: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Match Date & Time (UTC)</Label>
              <Input type="datetime-local" value={newMatch.matchDate}
                onChange={(e) => setNewMatch({ ...newMatch, matchDate: e.target.value })} />
            </div>
            <div>
              <Label>Venue (optional)</Label>
              <Input placeholder="e.g. MetLife Stadium" value={newMatch.venue}
                onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMatchOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateMatch}
              disabled={!newMatch.homeTeam.trim() || !newMatch.awayTeam.trim() || !newMatch.matchDate}>
              Create Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Group Dialog (R1) ─────────────────────────────────────────── */}
      <Dialog open={isGroupOpen} onOpenChange={setIsGroupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Group — Group Stage</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Group</Label>
                <Select value={newGroup.groupName} onValueChange={(v) => setNewGroup({ ...newGroup, groupName: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GROUP_NAMES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Match Number</Label>
                <Input type="number" min={1} value={newGroup.matchNumber}
                  onChange={(e) => setNewGroup({ ...newGroup, matchNumber: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div>
              <Label>Submission Deadline</Label>
              <Input type="datetime-local" value={newGroup.matchDate}
                onChange={(e) => setNewGroup({ ...newGroup, matchDate: e.target.value })} />
            </div>
            <div>
              <Label>Teams</Label>
              <div className="space-y-1.5 mt-1">
                {newGroup.teams.map((team, i) => (
                  <Input key={i} placeholder={`Team ${i + 1}`} value={team}
                    onChange={(e) => {
                      const teams = [...newGroup.teams];
                      teams[i] = e.target.value;
                      setNewGroup({ ...newGroup, teams });
                    }} />
                ))}
              </div>
              <Button size="sm" variant="ghost" className="mt-1 text-xs h-6"
                onClick={() => setNewGroup({ ...newGroup, teams: [...newGroup.teams, ""] })}>
                + Add team
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup} disabled={!newGroup.matchDate}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={!!editMatch} onOpenChange={(o) => !o && setEditMatch(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Match</DialogTitle></DialogHeader>
          {editMatch && (
            <div className="space-y-3">
              <div>
                <Label>Match Number</Label>
                <Input type="number" min={1} value={editMatch.matchNumber}
                  onChange={(e) => setEditMatch({ ...editMatch, matchNumber: parseInt(e.target.value) || 1 })} />
              </div>
              {editMatch.groupTeams ? (
                <div>
                  <Label>Group Name</Label>
                  <Input value={editMatch.homeTeam}
                    onChange={(e) => setEditMatch({ ...editMatch, homeTeam: e.target.value })} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Home Team</Label>
                    <Input value={editMatch.homeTeam}
                      onChange={(e) => setEditMatch({ ...editMatch, homeTeam: e.target.value })} />
                  </div>
                  <div>
                    <Label>Away Team</Label>
                    <Input value={editMatch.awayTeam}
                      onChange={(e) => setEditMatch({ ...editMatch, awayTeam: e.target.value })} />
                  </div>
                </div>
              )}
              <div>
                <Label>Date & Time</Label>
                <Input type="datetime-local" value={editMatch.matchDate.slice(0, 16)}
                  onChange={(e) => setEditMatch({ ...editMatch, matchDate: e.target.value })} />
              </div>
              <div>
                <Label>Venue</Label>
                <Input value={editMatch.venue || ""}
                  onChange={(e) => setEditMatch({ ...editMatch, venue: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMatch(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Score Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={!!scoreMatch} onOpenChange={(o) => !o && setScoreMatch(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Score</DialogTitle></DialogHeader>
          {scoreMatch && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-center">
                {scoreMatch.homeTeam} vs {scoreMatch.awayTeam}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{scoreMatch.homeTeam}</Label>
                  <Input type="number" min={0} value={scoreData.homeScore}
                    onChange={(e) => setScoreData({ ...scoreData, homeScore: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>{scoreMatch.awayTeam}</Label>
                  <Input type="number" min={0} value={scoreData.awayScore}
                    onChange={(e) => setScoreData({ ...scoreData, awayScore: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreMatch(null)}>Cancel</Button>
            <Button onClick={handleScore}>Save Score</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Match card ────────────────────────────────────────────────────────────────

function MatchCard({ match, onEdit, onDelete, onScore }: {
  match: FifaMatch;
  onEdit: () => void;
  onDelete: () => void;
  onScore: () => void;
}) {
  const isGroup = match.round?.roundNumber === 1;
  const isR0 = match.round?.roundNumber === 0;
  const groupTeams = match.groupTeams as string[] | null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors">
      <div className="flex-1 min-w-0 space-y-1">
        {isR0 ? (
          <p className="text-sm font-semibold">🌍 Tournament Predictions</p>
        ) : isGroup ? (
          <>
            <p className="text-sm font-semibold">{match.homeTeam}</p>
            {groupTeams && groupTeams.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {groupTeams.map((t) => (
                  <span key={t} className="inline-flex items-center gap-0.5 text-[11px] bg-muted border border-border px-1.5 py-0.5 rounded-full">
                    <FifaTeamFlag teamName={t} className="text-xs" /> {t}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <FifaTeamFlag teamName={match.homeTeam} className="text-base flex-shrink-0" />
              <span className="text-sm font-semibold">{match.homeTeam}</span>
              {match.completed && match.homeScore !== null ? (
                <span className="text-xs font-black bg-slate-900 text-white px-1.5 py-0.5 rounded tabular-nums">
                  {match.homeScore}–{match.awayScore}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground px-1">vs</span>
              )}
              <FifaTeamFlag teamName={match.awayTeam} className="text-base flex-shrink-0" />
              <span className="text-sm font-semibold">{match.awayTeam}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(match.matchDate).toLocaleDateString("en-GB", {
                weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              })}
              {match.venue && ` · ${match.venue}`}
            </p>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-[10px] font-semibold text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5">
          {match._count?.questions ?? 0}Q
        </span>
        {!isR0 && !isGroup && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onScore}>
            Score
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onEdit}>
          <Edit className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
