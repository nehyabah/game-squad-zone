import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Round } from "./SixNationsManager";
import { roundsAPI } from "@/lib/api/six-nations";
import { useToast } from "@/hooks/use-toast";

interface RoundsManagerProps {
  rounds: Round[];
  setRounds: (rounds: Round[]) => void;
  onRoundCreated?: () => void;
  onRefresh?: () => void;
}

export default function RoundsManager({ rounds, setRounds, onRoundCreated, onRefresh }: RoundsManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRound, setNewRound] = useState({
    roundNumber: 1,
    name: "",
    startDate: "",
    endDate: "",
  });
  const { toast } = useToast();

  const handleCreateRound = async () => {
    try {
      await roundsAPI.create(newRound);
      setIsCreateDialogOpen(false);
      setNewRound({ roundNumber: rounds.length + 2, name: "", startDate: "", endDate: "" });
      toast({
        title: "Success",
        description: "Round created successfully",
      });
      if (onRefresh) {
        onRefresh();
      }
      if (onRoundCreated) {
        onRoundCreated();
      }
    } catch (error) {
      console.error("Error creating round:", error);
      toast({
        title: "Error",
        description: "Failed to create round",
        variant: "destructive",
      });
    }
  };

  const handleActivateRound = async (roundId: string) => {
    try {
      await roundsAPI.activate(roundId);
      toast({
        title: "Success",
        description: "Round activated successfully",
      });
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error activating round:", error);
      toast({
        title: "Error",
        description: "Failed to activate round",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRound = async (roundId: string) => {
    if (!confirm("Are you sure? This will delete all matches and questions in this round.")) {
      return;
    }
    try {
      await roundsAPI.delete(roundId);
      toast({
        title: "Success",
        description: "Round deleted successfully",
      });
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting round:", error);
      toast({
        title: "Error",
        description: "Failed to delete round",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tournament Rounds</h3>
          <p className="text-sm text-muted-foreground">
            Manage the 5 rounds of the 6 Nations tournament
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Round
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Round</DialogTitle>
              <DialogDescription>
                Add a new round to the 6 Nations tournament
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roundNumber" className="text-right">
                  Round #
                </Label>
                <Input
                  id="roundNumber"
                  type="number"
                  min="1"
                  max="5"
                  value={newRound.roundNumber}
                  onChange={(e) => setNewRound({ ...newRound, roundNumber: parseInt(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newRound.name}
                  onChange={(e) => setNewRound({ ...newRound, name: e.target.value })}
                  placeholder="e.g., Round 1"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newRound.startDate}
                  onChange={(e) => setNewRound({ ...newRound, startDate: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newRound.endDate}
                  onChange={(e) => setNewRound({ ...newRound, endDate: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateRound}>Create Round</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {rounds.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No rounds created yet</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Round
              </Button>
            </CardContent>
          </Card>
        ) : (
          rounds.map((round) => (
            <Card key={round.id} className={round.isActive ? "border-green-500" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {round.name}
                      {round.isActive && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Round {round.roundNumber} • {new Date(round.startDate).toLocaleDateString()} - {new Date(round.endDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!round.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActivateRound(round.id)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteRound(round.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
