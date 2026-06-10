import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Check, Lock, Unlock } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fifaRoundsAPI, FifaRound } from "@/lib/api/fifa";
import { useToast } from "@/hooks/use-toast";

const MAX_POINTS: Record<number, number> = { 0: 45, 1: 48, 2: 96, 3: 64, 4: 40, 5: 36, 6: 21 };

interface Props {
  rounds: FifaRound[];
  onRefresh?: () => void;
}

export default function FifaRoundsManager({ rounds, onRefresh }: Props) {
  const [editRound, setEditRound] = useState<FifaRound | null>(null);
  const [editName, setEditName] = useState("");
  const [editLockTime, setEditLockTime] = useState("");
  const { toast } = useToast();

  const openEdit = (round: FifaRound) => {
    setEditRound(round);
    setEditName(round.name);
    setEditLockTime(round.lockTime ? new Date(round.lockTime).toISOString().slice(0, 16) : "");
  };

  const handleUpdate = async () => {
    if (!editRound) return;
    try {
      await fifaRoundsAPI.update(editRound.id, {
        name: editName,
        lockTime: editLockTime ? new Date(editLockTime).toISOString() : null,
      });
      setEditRound(null);
      toast({ title: "Round updated" });
      onRefresh?.();
    } catch (e: any) {
      toast({ title: "Failed to update", description: e.response?.data?.error || e.message, variant: "destructive" });
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await fifaRoundsAPI.activate(id);
      toast({ title: "Round activated" });
      onRefresh?.();
    } catch (e: any) {
      toast({ title: "Failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await fifaRoundsAPI.deactivate(id);
      toast({ title: "Round deactivated" });
      onRefresh?.();
    } catch (e: any) {
      toast({ title: "Failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    }
  };

  const handleToggleLock = async (round: FifaRound) => {
    try {
      if (round.isLocked) {
        await fifaRoundsAPI.unlock(round.id);
        toast({ title: "Round unlocked — submissions re-opened" });
      } else {
        await fifaRoundsAPI.lock(round.id);
        toast({ title: "Round locked — no more submissions" });
      }
      onRefresh?.();
    } catch (e: any) {
      toast({ title: "Failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    }
  };

  const isLocked = (r: FifaRound) =>
    r.isLocked || (r.lockTime != null && new Date() >= new Date(r.lockTime));

  return (
    <div className="space-y-3">
      <div className="mb-4">
        <h3 className="text-lg font-bold">Rounds</h3>
        <p className="text-xs text-muted-foreground">7 fixed rounds — edit title and lock time. Total max: 350 pts.</p>
      </div>

      {/* Summary */}
      <div className="bg-muted/30 rounded-lg border overflow-hidden mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-2 font-semibold">Round</th>
              <th className="text-center p-2 font-semibold">pts/Q</th>
              <th className="text-center p-2 font-semibold">Max pts</th>
              <th className="text-center p-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {[...rounds].sort((a, b) => a.roundNumber - b.roundNumber).map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-2 font-medium">{r.name}</td>
                <td className="text-center p-2">{r.pointsPerQuestion}</td>
                <td className="text-center p-2">{MAX_POINTS[r.roundNumber] ?? "–"}</td>
                <td className="text-center p-2">
                  {r.isActive && <Badge className="text-[10px] h-4">Active</Badge>}
                  {isLocked(r) && !r.isActive && <Badge variant="destructive" className="text-[10px] h-4">Locked</Badge>}
                  {!r.isActive && !isLocked(r) && <span className="text-muted-foreground text-[10px]">Inactive</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {[...rounds].sort((a, b) => a.roundNumber - b.roundNumber).map((round) => (
        <Card key={round.id} className={round.isActive ? "border-primary" : ""}>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono">R{round.roundNumber}</span>
                <CardTitle className="text-sm">{round.name}</CardTitle>
                {round.isActive && <Badge>Active</Badge>}
                {isLocked(round) && (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {round.isActive ? (
                  <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => handleDeactivate(round.id)}>
                    Deactivate
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => handleActivate(round.id)}>
                    <Check className="w-3 h-3" /> Activate
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={round.isLocked ? "outline" : "secondary"}
                  className="gap-1 h-7 text-xs"
                  onClick={() => handleToggleLock(round)}
                >
                  {round.isLocked
                    ? <><Unlock className="w-3 h-3" /> Unlock</>
                    : <><Lock className="w-3 h-3" /> Lock</>}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(round)}>
                  <Edit className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
              <span>{round.pointsPerQuestion} pts/question · max {MAX_POINTS[round.roundNumber] ?? "?"} pts</span>
              {round.lockTime && (
                <span className={isLocked(round) ? "text-destructive font-medium" : ""}>
                  Locks: {new Date(round.lockTime).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {!round.lockTime && <span className="italic">No lock time set</span>}
            </div>
          </CardHeader>
        </Card>
      ))}

      {rounds.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">Loading rounds…</p>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editRound} onOpenChange={(o) => !o && setEditRound(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Round {editRound?.roundNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. Group Stage" />
            </div>
            <div>
              <Label>Submission Lock Time</Label>
              <Input
                type="datetime-local"
                value={editLockTime}
                onChange={(e) => setEditLockTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Submissions auto-close at this time. Leave blank for no auto-lock.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRound(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
