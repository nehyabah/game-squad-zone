import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Check, X, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fifaQuestionsAPI, FifaRound, FifaMatch, FifaQuestion } from "@/lib/api/fifa";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  rounds: FifaRound[];
  matches: FifaMatch[];
  questions: FifaQuestion[];
  onRefresh?: () => void;
}

const BLANK_Q = {
  roundId: "",
  matchId: "",
  questionNumber: 1,
  questionText: "",
  questionType: "multiple_choice" as const,
  options: "",
  points: 1,
};

const ROUND_SHORT: Record<number, string> = {
  0: "Predictions", 1: "Groups", 2: "R32", 3: "R16", 4: "QF", 5: "SF", 6: "Final",
};

export default function FifaQuestionsManager({ rounds, matches, questions, onRefresh }: Props) {
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<FifaQuestion | null>(null);
  const [answerQuestion, setAnswerQuestion] = useState<FifaQuestion | null>(null);
  const [newQuestion, setNewQuestion] = useState(BLANK_Q);
  const [correctAnswerInput, setCorrectAnswerInput] = useState("");
  const { toast } = useToast();

  // Default to first round once rounds are available
  useEffect(() => {
    if (rounds.length > 0 && !selectedRoundId) {
      setSelectedRoundId(rounds[0].id);
    }
  }, [rounds]);

  // Questions that belong to a given round (direct for R0/1, via matches for R2-6)
  const questionsForRound = (roundId: string): FifaQuestion[] => {
    const round = rounds.find((r) => r.id === roundId);
    if (!round) return [];
    if (round.roundNumber <= 1) return questions.filter((q) => q.roundId === roundId);
    const matchIds = new Set(matches.filter((m) => m.roundId === roundId).map((m) => m.id));
    return questions.filter((q) => q.matchId && matchIds.has(q.matchId));
  };

  const selectedRound = rounds.find((r) => r.id === selectedRoundId);
  const isEarlyRound = (selectedRound?.roundNumber ?? 0) <= 1;
  const roundMatches = matches.filter((m) => m.roundId === selectedRoundId);
  const visibleQuestions = questionsForRound(selectedRoundId);

  // Open create dialog pre-filled for the current tab
  const openCreate = () => {
    if (isEarlyRound && selectedRoundId) {
      setNewQuestion({
        ...BLANK_Q,
        roundId: selectedRoundId,
        points: selectedRound?.pointsPerQuestion ?? 1,
        questionNumber: visibleQuestions.length + 1,
      });
    } else {
      setNewQuestion({
        ...BLANK_Q,
        points: selectedRound?.pointsPerQuestion ?? 1,
      });
    }
    setIsCreateOpen(true);
  };

  const handleRoundSelect = (roundId: string) => {
    const round = rounds.find((r) => r.id === roundId);
    setNewQuestion((prev) => ({
      ...prev,
      roundId,
      matchId: "",
      points: round?.pointsPerQuestion ?? prev.points,
      questionNumber: questions.filter((q) => q.roundId === roundId).length + 1,
    }));
  };

  const handleMatchSelect = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    const round = rounds.find((r) => r.id === match?.roundId);
    setNewQuestion((prev) => ({
      ...prev,
      matchId,
      roundId: "",
      points: round?.pointsPerQuestion ?? prev.points,
      questionNumber: questions.filter((q) => q.matchId === matchId).length + 1,
    }));
  };

  const handleCreate = async () => {
    try {
      const options =
        newQuestion.questionType === "multiple_choice"
          ? newQuestion.options.split("\n").map((o) => o.trim()).filter(Boolean)
          : undefined;
      await fifaQuestionsAPI.create({
        roundId: newQuestion.roundId || undefined,
        matchId: newQuestion.matchId || undefined,
        questionNumber: newQuestion.questionNumber,
        questionText: newQuestion.questionText,
        questionType: newQuestion.questionType,
        options,
        points: newQuestion.points,
      });
      setIsCreateOpen(false);
      setNewQuestion(BLANK_Q);
      toast({ title: "Question created" });
      onRefresh?.();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to create question", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!editQuestion) return;
    try {
      await fifaQuestionsAPI.update(editQuestion.id, {
        questionNumber: editQuestion.questionNumber,
        questionText: editQuestion.questionText,
        questionType: editQuestion.questionType as any,
        options:
          editQuestion.questionType === "multiple_choice"
            ? (editQuestion.options as string[] | null) ?? []
            : undefined,
        points: editQuestion.points,
      });
      setEditQuestion(null);
      toast({ title: "Question updated" });
      onRefresh?.();
    } catch {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question and all answers?")) return;
    try {
      await fifaQuestionsAPI.delete(id);
      toast({ title: "Deleted" });
      onRefresh?.();
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleSetAnswer = async () => {
    if (!answerQuestion) return;
    try {
      await fifaQuestionsAPI.setCorrectAnswer(answerQuestion.id, correctAnswerInput);
      setAnswerQuestion(null);
      setCorrectAnswerInput("");
      toast({ title: "Correct answer set — all answers graded" });
      onRefresh?.();
    } catch {
      toast({ title: "Error", description: "Failed to set answer", variant: "destructive" });
    }
  };

  const handleClearAnswer = async (id: string) => {
    if (!confirm("Clear this correct answer? All grades will be reset.")) return;
    try {
      await fifaQuestionsAPI.clearCorrectAnswer(id);
      toast({ title: "Answer cleared" });
      onRefresh?.();
    } catch {
      toast({ title: "Error", description: "Failed to clear", variant: "destructive" });
    }
  };

  const matchLabel = (m: FifaMatch) => {
    if (m.round?.roundNumber === 1 || (m.groupTeams && (m.groupTeams as string[]).length > 0)) return m.homeTeam;
    return `${m.homeTeam} vs ${m.awayTeam}`;
  };

  return (
    <div className="space-y-4">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">Questions</h3>
          <p className="text-xs text-muted-foreground">Select a round to view and manage its questions</p>
        </div>
        <Button size="sm" className="gap-1.5" disabled={!selectedRoundId} onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Question
        </Button>
      </div>

      {/* ── Round tabs ────────────────────────────────────────────────────── */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}
      >
        {[...rounds].sort((a, b) => a.roundNumber - b.roundNumber).map((round) => {
          const count = questionsForRound(round.id).length;
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
            {selectedRound.pointsPerQuestion} pts/question · {visibleQuestions.length} question{visibleQuestions.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* ── Questions for selected round ──────────────────────────────────── */}
      {visibleQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center rounded-xl border border-dashed border-border">
          <p className="font-semibold text-sm text-foreground">No questions yet</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            {isEarlyRound
              ? "Add questions directly to this round using the button above."
              : roundMatches.length === 0
                ? "Add matches first (in the Matches tab), then add questions here."
                : "Click Add Question and select a match to add questions."}
          </p>
          <Button size="sm" variant="outline" className="gap-1.5 mt-1" onClick={openCreate} disabled={!isEarlyRound && roundMatches.length === 0}>
            <Plus className="w-3.5 h-3.5" /> Add Question
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* R0 / R1 — direct round questions */}
          {isEarlyRound && visibleQuestions.length > 0 && (
            <div className="space-y-1.5">
              {visibleQuestions.map((q) => (
                <QuestionRow
                  key={q.id}
                  q={q}
                  onEdit={() => setEditQuestion(q)}
                  onDelete={() => handleDelete(q.id)}
                  onSetAnswer={() => { setAnswerQuestion(q); setCorrectAnswerInput(""); }}
                  onClearAnswer={() => handleClearAnswer(q.id)}
                />
              ))}
            </div>
          )}

          {/* R2–6 — grouped by match */}
          {!isEarlyRound && roundMatches
            .map((match) => {
              const mqs = questions.filter((q) => q.matchId === match.id);
              return { match, mqs };
            })
            .filter(({ mqs }) => mqs.length > 0)
            .map(({ match, mqs }) => (
              <div key={match.id} className="space-y-1.5">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-semibold text-muted-foreground">{matchLabel(match)}</span>
                  {match.completed && match.homeScore !== null && (
                    <Badge variant="secondary" className="text-[10px]">
                      FT {match.homeScore}–{match.awayScore}
                    </Badge>
                  )}
                </div>
                {mqs.map((q) => (
                  <QuestionRow
                    key={q.id}
                    q={q}
                    onEdit={() => setEditQuestion(q)}
                    onDelete={() => handleDelete(q.id)}
                    onSetAnswer={() => { setAnswerQuestion(q); setCorrectAnswerInput(""); }}
                    onClearAnswer={() => handleClearAnswer(q.id)}
                  />
                ))}
              </div>
            ))}
        </div>
      )}

      {/* ── Create Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Question
              {selectedRound && <span className="text-muted-foreground font-normal text-sm ml-2">— {selectedRound.name}</span>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* For R2-6, show match selector filtered to this round */}
            {!isEarlyRound && (
              <div>
                <Label>Match <span className="text-destructive">*</span></Label>
                <Select
                  value={newQuestion.matchId}
                  onValueChange={handleMatchSelect}
                >
                  <SelectTrigger><SelectValue placeholder="Select a match…" /></SelectTrigger>
                  <SelectContent>
                    {roundMatches.length === 0 ? (
                      <div className="px-2 py-2 text-xs text-muted-foreground italic">No matches for this round yet</div>
                    ) : roundMatches.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{matchLabel(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* For R0/R1 with multi-round support, show round selector */}
            {isEarlyRound && rounds.filter((r) => r.roundNumber <= 1).length > 1 && (
              <div>
                <Label>Round</Label>
                <Select value={newQuestion.roundId} onValueChange={handleRoundSelect}>
                  <SelectTrigger><SelectValue placeholder="Select round…" /></SelectTrigger>
                  <SelectContent>
                    {rounds.filter((r) => r.roundNumber <= 1).map((r) => (
                      <SelectItem key={r.id} value={r.id}>Round {r.roundNumber} — {r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Question Number</Label>
              <Input type="number" min={1} value={newQuestion.questionNumber}
                onChange={(e) => setNewQuestion({ ...newQuestion, questionNumber: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <Label>Question Text</Label>
              <Textarea value={newQuestion.questionText}
                onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                rows={2} placeholder="e.g. Who will win this match?" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={newQuestion.questionType} onValueChange={(v: any) => setNewQuestion({ ...newQuestion, questionType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="yes_no">Yes / No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newQuestion.questionType === "multiple_choice" && (
              <div>
                <Label>Options (one per line) <span className="text-destructive">*</span></Label>
                <Textarea
                  value={newQuestion.options}
                  onChange={(e) => setNewQuestion({ ...newQuestion, options: e.target.value })}
                  rows={4}
                  placeholder={"Brazil\nArgentina\nFrance\nEngland"}
                  className={!newQuestion.options.trim() ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {!newQuestion.options.trim() && (
                  <p className="text-xs text-destructive mt-1">Options are required for multiple choice questions.</p>
                )}
              </div>
            )}
            <div>
              <Label>Points</Label>
              <Input type="number" min={1} value={newQuestion.points}
                onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={
                (!newQuestion.roundId && !newQuestion.matchId) ||
                !newQuestion.questionText.trim() ||
                (newQuestion.questionType === "multiple_choice" && !newQuestion.options.trim())
              }
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Set Correct Answer Dialog ─────────────────────────────────────── */}
      <Dialog open={!!answerQuestion} onOpenChange={(o) => !o && setAnswerQuestion(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set Correct Answer</DialogTitle></DialogHeader>
          {answerQuestion && (
            <div className="space-y-3">
              <p className="text-sm font-medium">{answerQuestion.questionText}</p>
              {answerQuestion.questionType === "yes_no" ? (
                <Select value={correctAnswerInput} onValueChange={setCorrectAnswerInput}>
                  <SelectTrigger><SelectValue placeholder="Select answer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : answerQuestion.options && (answerQuestion.options as string[]).length > 0 ? (
                <Select value={correctAnswerInput} onValueChange={setCorrectAnswerInput}>
                  <SelectTrigger><SelectValue placeholder="Select answer" /></SelectTrigger>
                  <SelectContent>
                    {(answerQuestion.options as string[]).map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input placeholder="Type correct answer" value={correctAnswerInput}
                  onChange={(e) => setCorrectAnswerInput(e.target.value)} />
              )}
              <p className="text-xs text-muted-foreground">Setting this will immediately grade all player answers.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnswerQuestion(null)}>Cancel</Button>
            <Button onClick={handleSetAnswer} disabled={!correctAnswerInput}>Set Answer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={!!editQuestion} onOpenChange={(o) => !o && setEditQuestion(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Question</DialogTitle></DialogHeader>
          {editQuestion && (
            <div className="space-y-3">
              <div>
                <Label>Question Number</Label>
                <Input type="number" min={1} value={editQuestion.questionNumber}
                  onChange={(e) => setEditQuestion({ ...editQuestion, questionNumber: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <Label>Question Text</Label>
                <Textarea value={editQuestion.questionText}
                  onChange={(e) => setEditQuestion({ ...editQuestion, questionText: e.target.value })} rows={2} />
              </div>
              {editQuestion.questionType === "multiple_choice" && (
                <div>
                  <Label>Options (one per line)</Label>
                  <Textarea
                    value={Array.isArray(editQuestion.options) ? (editQuestion.options as string[]).join("\n") : ""}
                    onChange={(e) => setEditQuestion({ ...editQuestion, options: e.target.value.split("\n") as any })}
                    rows={4}
                  />
                </div>
              )}
              <div>
                <Label>Points</Label>
                <Input type="number" min={1} value={editQuestion.points}
                  onChange={(e) => setEditQuestion({ ...editQuestion, points: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditQuestion(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Question row ─────────────────────────────────────────────────────────────

function QuestionRow({ q, onEdit, onDelete, onSetAnswer, onClearAnswer }: {
  q: FifaQuestion;
  onEdit: () => void;
  onDelete: () => void;
  onSetAnswer: () => void;
  onClearAnswer: () => void;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black bg-muted text-muted-foreground rounded px-1.5 py-0.5">Q{q.questionNumber}</span>
          <span className="text-[10px] font-semibold text-muted-foreground capitalize">{q.questionType.replace("_", " ")}</span>
          <span className="text-[10px] font-semibold text-primary bg-primary/8 border border-primary/15 rounded-full px-1.5 py-0.5">{q.points}pt{q.points !== 1 ? "s" : ""}</span>
        </div>
        <p className="text-sm font-medium leading-snug">{q.questionText}</p>
        {q.options && Array.isArray(q.options) && (q.options as string[]).length > 0 && (
          <p className="text-xs text-muted-foreground truncate">{(q.options as string[]).join(" · ")}</p>
        )}
        {q.correctAnswer && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
              <Check className="w-2.5 h-2.5" /> {q.correctAnswer}
            </span>
            <button onClick={onClearAnswer} className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {!q.correctAnswer && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onSetAnswer}>
            <Check className="w-3 h-3" /> Answer
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
