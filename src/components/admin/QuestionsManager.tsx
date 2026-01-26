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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, CheckCircle, X, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Match, Question } from "./SixNationsManager";
import { getTeamFlagClass, TeamFlag } from "@/lib/utils/sixNations.tsx";
import { questionsAPI } from "@/lib/api/six-nations";
import { useToast } from "@/hooks/use-toast";

interface QuestionsManagerProps {
  matches: Match[];
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  onRefresh?: () => void;
}

export default function QuestionsManager({ matches, questions, setQuestions, onRefresh }: QuestionsManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [openMatches, setOpenMatches] = useState<Record<string, boolean>>({});
  const [newQuestion, setNewQuestion] = useState({
    matchId: "",
    questionNumber: 1,
    questionText: "",
    questionType: "multiple_choice" as "multiple_choice" | "yes_no",
    options: ["", "", ""],
    points: 1,
  });
  const { toast } = useToast();

  // Toggle match collapse state
  const toggleMatch = (matchId: string) => {
    setOpenMatches(prev => ({
      ...prev,
      [matchId]: !prev[matchId]
    }));
  };

  // Calculate next available question number for selected match
  const getNextQuestionNumber = (matchId: string) => {
    if (!matchId) return 1;
    const matchQuestions = questions.filter(q => q.matchId === matchId);
    const existingNumbers = matchQuestions.map(q => q.questionNumber);
    // Find the first available number from 1-3
    for (let i = 1; i <= 3; i++) {
      if (!existingNumbers.includes(i)) {
        return i;
      }
    }
    return matchQuestions.length + 1; // If all 3 are taken, return next number
  };

  // Update question number when match changes
  const handleMatchChange = (matchId: string) => {
    const nextNumber = getNextQuestionNumber(matchId);
    setNewQuestion({
      ...newQuestion,
      matchId,
      questionNumber: nextNumber,
    });
  };

  // Get existing questions count for a match
  const getMatchQuestionCount = (matchId: string) => {
    return questions.filter(q => q.matchId === matchId).length;
  };

  const handleAddOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, ""]
    });
  };

  const handleRemoveOption = (index: number) => {
    setNewQuestion({
      ...newQuestion,
      options: newQuestion.options.filter((_, i) => i !== index)
    });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = value;
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions
    });
  };

  // Detect duplicate options (case-insensitive, trimmed)
  const detectDuplicates = () => {
    const options = newQuestion.options;
    const duplicateIndices: number[] = [];
    const seen = new Map<string, number[]>();

    options.forEach((option, index) => {
      const normalized = option.trim().toLowerCase();
      if (!normalized) return; // Skip empty options for duplicate check

      if (seen.has(normalized)) {
        // Mark this index and all previous indices with same value as duplicates
        duplicateIndices.push(index);
        seen.get(normalized)!.forEach(i => {
          if (!duplicateIndices.includes(i)) {
            duplicateIndices.push(i);
          }
        });
        seen.get(normalized)!.push(index);
      } else {
        seen.set(normalized, [index]);
      }
    });

    return duplicateIndices;
  };

  const duplicateIndices = detectDuplicates();
  const hasDuplicates = duplicateIndices.length > 0;
  const hasEmptyOptions = newQuestion.questionType === "multiple_choice" &&
    newQuestion.options.some(opt => opt.trim() === "");
  const isFormValid = newQuestion.matchId &&
    newQuestion.questionText.trim() &&
    !hasDuplicates &&
    !hasEmptyOptions;

  const handleCreateQuestion = async () => {
    try {
      await questionsAPI.create({
        matchId: newQuestion.matchId,
        questionNumber: newQuestion.questionNumber,
        questionText: newQuestion.questionText,
        questionType: newQuestion.questionType,
        options: newQuestion.questionType === "multiple_choice" ? newQuestion.options.filter(o => o.trim()) : undefined,
        points: newQuestion.points,
      });

      // Keep the same match selected and increment question number
      const currentMatchId = newQuestion.matchId;
      const nextNumber = newQuestion.questionNumber + 1;

      // Reset form but keep match selected for easier multi-question creation
      setNewQuestion({
        matchId: currentMatchId,
        questionNumber: nextNumber,
        questionText: "",
        questionType: "multiple_choice",
        options: ["", "", ""],
        points: 1,
      });

      toast({
        title: "Success",
        description: "Question created successfully. You can add another question to this match.",
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error creating question:", error);
      toast({
        title: "Error",
        description: "Failed to create question",
        variant: "destructive",
      });
    }
  };

  const handleSetCorrectAnswer = async (questionId: string, answer: string) => {
    try {
      const updatedQuestion = await questionsAPI.setCorrectAnswer(questionId, answer);
      // Update local state instead of full refresh
      setQuestions(questions.map(q =>
        q.id === questionId ? { ...q, correctAnswer: answer } : q
      ));
      toast({
        title: "Success",
        description: "Correct answer set successfully",
      });
    } catch (error) {
      console.error("Error setting correct answer:", error);
      toast({
        title: "Error",
        description: "Failed to set correct answer",
        variant: "destructive",
      });
    }
  };

  const handleClearCorrectAnswer = async (questionId: string) => {
    if (!confirm("Are you sure you want to clear the correct answer? This will reset all user answer results for this question.")) {
      return;
    }
    try {
      await questionsAPI.clearCorrectAnswer(questionId);
      // Update local state instead of full refresh
      setQuestions(questions.map(q =>
        q.id === questionId ? { ...q, correctAnswer: null } : q
      ));
      toast({
        title: "Success",
        description: "Correct answer cleared successfully",
      });
    } catch (error) {
      console.error("Error clearing correct answer:", error);
      toast({
        title: "Error",
        description: "Failed to clear correct answer",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }
    try {
      await questionsAPI.delete(questionId);
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const handleEditQuestion = async () => {
    if (!editingQuestion) return;

    try {
      await questionsAPI.update(editingQuestion.id, {
        questionNumber: newQuestion.questionNumber,
        questionText: newQuestion.questionText,
        questionType: newQuestion.questionType,
        options: newQuestion.questionType === "multiple_choice" ? newQuestion.options.filter(o => o.trim()) : undefined,
        points: newQuestion.points,
      });

      toast({
        title: "Success",
        description: "Question updated successfully",
      });

      setEditingQuestion(null);
      setNewQuestion({
        matchId: "",
        questionNumber: 1,
        questionText: "",
        questionType: "multiple_choice",
        options: ["", "", ""],
        points: 1,
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error updating question:", error);
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setNewQuestion({
      matchId: question.matchId,
      questionNumber: question.questionNumber,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.questionType === "multiple_choice" && question.options
        ? [...question.options]
        : ["", "", ""],
      points: question.points,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Questions</h3>
          <p className="text-sm text-muted-foreground">
            Manage questions - 3 per match, 9 per round, 45 total
          </p>
        </div>
        <Dialog
          open={isCreateDialogOpen || !!editingQuestion}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setEditingQuestion(null);
              setNewQuestion({
                matchId: "",
                questionNumber: 1,
                questionText: "",
                questionType: "multiple_choice",
                options: ["", "", ""],
                points: 1,
              });
            } else {
              setIsCreateDialogOpen(true);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "Edit Question" : "Create New Question"}</DialogTitle>
              <DialogDescription>
                {editingQuestion ? "Update question details" : "Add a question to a match"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="matchId" className="text-right">
                  Match
                </Label>
                <div className="col-span-3 space-y-2">
                  <Select
                    value={newQuestion.matchId}
                    onValueChange={handleMatchChange}
                    disabled={!!editingQuestion}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select match" />
                    </SelectTrigger>
                    <SelectContent>
                      {matches.map(match => {
                        const questionCount = getMatchQuestionCount(match.id);
                        return (
                          <SelectItem key={match.id} value={match.id}>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{match.roundName} - Match {match.matchNumber}:</span>
                              <span className={getTeamFlagClass(match.homeTeam)}></span>
                              <span>{match.homeTeam}</span>
                              <span>vs</span>
                              <span className={getTeamFlagClass(match.awayTeam)}></span>
                              <span>{match.awayTeam}</span>
                              <Badge variant="secondary" className="ml-2">{questionCount}/3</Badge>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {newQuestion.matchId && !editingQuestion && (
                    <p className="text-xs text-muted-foreground">
                      {getMatchQuestionCount(newQuestion.matchId)} question(s) already exist for this match
                    </p>
                  )}
                  {editingQuestion && (
                    <p className="text-xs text-muted-foreground">
                      Match cannot be changed when editing
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="questionNumber" className="text-right">
                  Question #
                </Label>
                <div className="col-span-3">
                  <Input
                    id="questionNumber"
                    type="number"
                    min="1"
                    value={newQuestion.questionNumber}
                    onChange={(e) => setNewQuestion({ ...newQuestion, questionNumber: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-calculated as next available number (can be edited)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="questionType" className="text-right">
                  Type
                </Label>
                <Select
                  value={newQuestion.questionType}
                  onValueChange={(value: "multiple_choice" | "yes_no") =>
                    setNewQuestion({ ...newQuestion, questionType: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="yes_no">Yes / No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="questionText" className="text-right pt-2">
                  Question
                </Label>
                <Textarea
                  id="questionText"
                  value={newQuestion.questionText}
                  onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                  placeholder="e.g., Who will score the first try?"
                  className="col-span-3"
                  rows={3}
                />
              </div>

              {newQuestion.questionType === "multiple_choice" && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Options</Label>
                  <div className="col-span-3 space-y-2">
                    <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md p-2">
                      ℹ️ "None of the above" will be automatically added as the last option
                    </p>
                    {newQuestion.options.map((option, index) => {
                      const isDuplicate = duplicateIndices.includes(index);
                      const isEmpty = option.trim() === "";
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => handleUpdateOption(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              className={isDuplicate ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {newQuestion.options.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveOption(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          {isDuplicate && !isEmpty && (
                            <p className="text-xs text-red-500 ml-1">
                              Duplicate option detected
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {hasDuplicates && (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-3">
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                          ⚠️ Duplicate options detected
                        </p>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                          Each option must be unique (case-insensitive). Please remove or rename duplicate options.
                        </p>
                      </div>
                    )}
                    {hasEmptyOptions && !hasDuplicates && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md p-3">
                        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                          ⚠️ Empty options detected
                        </p>
                        <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                          Please fill in all options or remove empty ones.
                        </p>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="points" className="text-right">
                  Points
                </Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={newQuestion.points}
                  onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingQuestion(null);
                setNewQuestion({
                  matchId: "",
                  questionNumber: 1,
                  questionText: "",
                  questionType: "multiple_choice",
                  options: ["", "", ""],
                  points: 1,
                });
              }}>
                Cancel
              </Button>
              {editingQuestion ? (
                <Button
                  onClick={handleEditQuestion}
                  disabled={!isFormValid}
                  title={!isFormValid ? "Please fix form errors before updating" : ""}
                >
                  Update Question
                </Button>
              ) : (
                <Button
                  onClick={handleCreateQuestion}
                  disabled={!isFormValid}
                  title={!isFormValid ? "Please fix form errors before creating" : ""}
                >
                  Create & Add Another
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No questions created yet</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Group questions by match
          (() => {
            // Create a map of matchId to questions
            const questionsByMatch = questions.reduce((acc, question) => {
              if (!acc[question.matchId]) {
                acc[question.matchId] = [];
              }
              acc[question.matchId].push(question);
              return acc;
            }, {} as Record<string, Question[]>);

            // Sort questions within each match by questionNumber
            Object.values(questionsByMatch).forEach(matchQuestions => {
              matchQuestions.sort((a, b) => a.questionNumber - b.questionNumber);
            });

            return Object.entries(questionsByMatch).map(([matchId, matchQuestions]) => {
              const match = matches.find(m => m.id === matchId);
              const isOpen = openMatches[matchId] !== false; // Default to open

              return (
                <Collapsible
                  key={matchId}
                  open={isOpen}
                  onOpenChange={() => toggleMatch(matchId)}
                  className="space-y-3"
                >
                  {/* Match Header */}
                  {match && (
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-lg border cursor-pointer hover:bg-muted/70 transition-colors">
                        {isOpen ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                        <TeamFlag teamName={match.homeTeam} />
                        <span className="font-semibold">{match.homeTeam}</span>
                        <span className="text-muted-foreground">vs</span>
                        <TeamFlag teamName={match.awayTeam} />
                        <span className="font-semibold">{match.awayTeam}</span>
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-2">
                          <span>{new Date(match.matchDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          <span>{new Date(match.matchDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="mx-1">•</span>
                          <span>{match.roundName} - Match {match.matchNumber}</span>
                        </span>
                        <Badge variant="secondary">{matchQuestions.length}/3 questions</Badge>
                      </div>
                    </CollapsibleTrigger>
                  )}

                  {/* Questions for this match */}
                  <CollapsibleContent>
                    <div className="grid gap-3 pl-4">
                    {matchQuestions.map((question) => (
                      <Card key={question.id} className={question.correctAnswer ? "border-green-500" : ""}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="flex items-center gap-2 mb-2">
                                <span>Q{question.questionNumber}</span>
                                <Badge variant={question.questionType === "yes_no" ? "secondary" : "default"}>
                                  {question.questionType === "yes_no" ? "Yes/No" : "Multiple Choice"}
                                </Badge>
                                <Badge variant="outline">{question.points} pt{question.points > 1 ? "s" : ""}</Badge>
                                {question.correctAnswer && (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                              </CardTitle>
                            <CardDescription className="text-base text-foreground mb-3">
                              {question.questionText}
                            </CardDescription>

                    {question.questionType === "multiple_choice" && question.options && (
                      <div className="space-y-1 mt-2">
                        {question.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleSetCorrectAnswer(question.id, option)}
                            className={`w-full text-left text-sm px-3 py-2 rounded border transition-colors cursor-pointer ${
                              question.correctAnswer === option
                                ? "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400 font-semibold"
                                : "bg-muted/50 hover:bg-muted hover:border-primary/50"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    {question.questionType === "yes_no" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSetCorrectAnswer(question.id, "Yes")}
                          className={`text-sm px-4 py-2 rounded border transition-colors cursor-pointer ${
                            question.correctAnswer === "Yes"
                              ? "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400 font-semibold"
                              : "bg-muted/50 hover:bg-muted hover:border-primary/50"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => handleSetCorrectAnswer(question.id, "No")}
                          className={`text-sm px-4 py-2 rounded border transition-colors cursor-pointer ${
                            question.correctAnswer === "No"
                              ? "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400 font-semibold"
                              : "bg-muted/50 hover:bg-muted hover:border-primary/50"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(question)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Question
                    </Button>
                    {question.correctAnswer && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                        onClick={() => handleClearCorrectAnswer(question.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear Answer
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          });
        })()
        )}
      </div>
    </div>
  );
}
