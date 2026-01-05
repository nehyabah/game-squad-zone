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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Round, Match } from "./SixNationsManager";
import { TEAM_NAMES, getTeamFlagClass, TeamFlag } from "@/lib/utils/sixNations.tsx";
import { matchesAPI } from "@/lib/api/six-nations";
import { useToast } from "@/hooks/use-toast";

interface MatchesManagerProps {
  rounds: Round[];
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  onMatchCreated?: () => void;
  onRefresh?: () => void;
}

export default function MatchesManager({ rounds, matches, setMatches, onMatchCreated, onRefresh }: MatchesManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [newMatch, setNewMatch] = useState({
    roundId: "",
    matchNumber: 1,
    homeTeam: "",
    awayTeam: "",
    matchDate: "",
    venue: "",
  });
  const { toast } = useToast();

  const handleCreateMatch = async () => {
    try {
      await matchesAPI.create(newMatch);
      setIsCreateDialogOpen(false);
      setNewMatch({
        roundId: "",
        matchNumber: 1,
        homeTeam: "",
        awayTeam: "",
        matchDate: "",
        venue: "",
      });
      toast({
        title: "Success",
        description: "Match created successfully",
      });
      if (onRefresh) {
        onRefresh();
      }
      if (onMatchCreated) {
        onMatchCreated();
      }
    } catch (error) {
      console.error("Error creating match:", error);
      toast({
        title: "Error",
        description: "Failed to create match",
        variant: "destructive",
      });
    }
  };

  const handleUpdateScore = async (matchId: string, homeScore: number, awayScore: number) => {
    try {
      await matchesAPI.updateScore(matchId, homeScore, awayScore);
      setEditingMatch(null);
      toast({
        title: "Success",
        description: "Match score updated successfully",
      });
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error updating match score:", error);
      toast({
        title: "Error",
        description: "Failed to update match score",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Are you sure? This will delete all questions for this match.")) {
      return;
    }
    try {
      await matchesAPI.delete(matchId);
      toast({
        title: "Success",
        description: "Match deleted successfully",
      });
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting match:", error);
      toast({
        title: "Error",
        description: "Failed to delete match",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Matches</h3>
          <p className="text-sm text-muted-foreground">
            Manage matches - 3 per round, 15 total
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Match
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Match</DialogTitle>
              <DialogDescription>
                Add a new match to a round
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roundId" className="text-right">
                  Round
                </Label>
                <Select
                  value={newMatch.roundId}
                  onValueChange={(value) => setNewMatch({ ...newMatch, roundId: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select round" />
                  </SelectTrigger>
                  <SelectContent>
                    {rounds.map(round => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.name} (Round {round.roundNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="matchNumber" className="text-right">
                  Match #
                </Label>
                <Input
                  id="matchNumber"
                  type="number"
                  min="1"
                  max="3"
                  value={newMatch.matchNumber}
                  onChange={(e) => setNewMatch({ ...newMatch, matchNumber: parseInt(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="homeTeam" className="text-right">
                  Home Team
                </Label>
                <Select
                  value={newMatch.homeTeam}
                  onValueChange={(value) => setNewMatch({ ...newMatch, homeTeam: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select home team" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_NAMES.map(team => (
                      <SelectItem key={team} value={team}>
                        <div className="flex items-center gap-2">
                          <span className={getTeamFlagClass(team)}></span>
                          <span>{team}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="awayTeam" className="text-right">
                  Away Team
                </Label>
                <Select
                  value={newMatch.awayTeam}
                  onValueChange={(value) => setNewMatch({ ...newMatch, awayTeam: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select away team" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_NAMES.map(team => (
                      <SelectItem key={team} value={team}>
                        <div className="flex items-center gap-2">
                          <span className={getTeamFlagClass(team)}></span>
                          <span>{team}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="matchDate" className="text-right">
                  Match Date
                </Label>
                <Input
                  id="matchDate"
                  type="datetime-local"
                  value={newMatch.matchDate}
                  onChange={(e) => setNewMatch({ ...newMatch, matchDate: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="venue" className="text-right">
                  Venue
                </Label>
                <Input
                  id="venue"
                  value={newMatch.venue}
                  onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
                  placeholder="e.g., Twickenham Stadium"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateMatch}>Create Match</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {matches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No matches created yet</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Match
              </Button>
            </CardContent>
          </Card>
        ) : (
          matches.map((match) => (
            <Card key={match.id} className={match.completed ? "border-green-500" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      <TeamFlag teamName={match.homeTeam} className="text-2xl" />
                      <span className="text-lg font-bold">{match.homeTeam}</span>
                      {match.completed && match.homeScore !== null && (
                        <span className="text-2xl font-black text-primary">{match.homeScore}</span>
                      )}
                      <span className="text-muted-foreground font-normal">vs</span>
                      {match.completed && match.awayScore !== null && (
                        <span className="text-2xl font-black text-primary">{match.awayScore}</span>
                      )}
                      <TeamFlag teamName={match.awayTeam} className="text-2xl" />
                      <span className="text-lg font-bold">{match.awayTeam}</span>
                      {match.completed && (
                        <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      {match.roundName} • Match {match.matchNumber} • {new Date(match.matchDate).toLocaleString()} • {match.venue}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Update Score
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Match Score</DialogTitle>
                          <DialogDescription>
                            {match.homeTeam} vs {match.awayTeam}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">{match.homeTeam}</Label>
                            <Input
                              type="number"
                              min="0"
                              defaultValue={match.homeScore || 0}
                              onChange={(e) => {
                                const awayScore = match.awayScore || 0;
                                handleUpdateScore(match.id, parseInt(e.target.value), awayScore);
                              }}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">{match.awayTeam}</Label>
                            <Input
                              type="number"
                              min="0"
                              defaultValue={match.awayScore || 0}
                              onChange={(e) => {
                                const homeScore = match.homeScore || 0;
                                handleUpdateScore(match.id, homeScore, parseInt(e.target.value));
                              }}
                              className="col-span-3"
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteMatch(match.id)}
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
