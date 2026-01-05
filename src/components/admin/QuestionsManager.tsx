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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, CheckCircle, X } from "lucide-react";
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
  const [newQuestion, setNewQuestion] = useState({
    matchId: "",
    questionNumber: 1,
    questionText: "",
    questionType: "multiple_choice" as "multiple_choice" | "yes_no",
    options: ["", "", ""],
    points: 1,
  });
  const { toast } = useToast();

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
      await questionsAPI.setCorrectAnswer(questionId, answer);
      toast({
        title: "Success",
        description: "Correct answer set successfully",
      });
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error setting correct answer:", error);
      toast({
        title: "Error",
        description: "Failed to set correct answer",
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Questions</h3>
          <p className="text-sm text-muted-foreground">
            Manage questions - 3 per match, 9 per round, 45 total
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Question</DialogTitle>
              <DialogDescription>
                Add a question to a match
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
                  {newQuestion.matchId && (
                    <p className="text-xs text-muted-foreground">
                      {getMatchQuestionCount(newQuestion.matchId)} question(s) already exist for this match
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
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => handleUpdateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
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
                    ))}
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
                setNewQuestion({
                  matchId: "",
                  questionNumber: 1,
                  questionText: "",
                  questionType: "multiple_choice",
                  options: ["", "", ""],
                  points: 1,
                });
              }}>
                Close
              </Button>
              <Button onClick={handleCreateQuestion}>
                Create & Add Another
              </Button>
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

              return (
                <div key={matchId} className="space-y-3">
                  {/* Match Header */}
                  {match && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-lg border">
                      <TeamFlag teamName={match.homeTeam} />
                      <span className="font-semibold">{match.homeTeam}</span>
                      <span className="text-muted-foreground">vs</span>
                      <TeamFlag teamName={match.awayTeam} />
                      <span className="font-semibold">{match.awayTeam}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {match.roundName} - Match {match.matchNumber}
                      </span>
                      <Badge variant="secondary">{matchQuestions.length}/3 questions</Badge>
                    </div>
                  )}

                  {/* Questions for this match */}
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
                          <div
                            key={index}
                            className={`text-sm px-3 py-2 rounded border ${
                              question.correctAnswer === option
                                ? "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400 font-semibold"
                                : "bg-muted/50"
                            }`}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}

                    {question.questionType === "yes_no" && (
                      <div className="flex gap-2 mt-2">
                        <div className={`text-sm px-4 py-2 rounded border ${
                          question.correctAnswer === "Yes"
                            ? "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400 font-semibold"
                            : "bg-muted/50"
                        }`}>
                          Yes
                        </div>
                        <div className={`text-sm px-4 py-2 rounded border ${
                          question.correctAnswer === "No"
                            ? "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400 font-semibold"
                            : "bg-muted/50"
                        }`}>
                          No
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Set Answer
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Set Correct Answer</DialogTitle>
                          <DialogDescription>
                            {question.questionText}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                          {question.questionType === "yes_no" ? (
                            <>
                              <Button
                                onClick={() => handleSetCorrectAnswer(question.id, "Yes")}
                                variant={question.correctAnswer === "Yes" ? "default" : "outline"}
                                className="w-full"
                              >
                                Yes
                              </Button>
                              <Button
                                onClick={() => handleSetCorrectAnswer(question.id, "No")}
                                variant={question.correctAnswer === "No" ? "default" : "outline"}
                                className="w-full"
                              >
                                No
                              </Button>
                            </>
                          ) : (
                            question.options?.map((option) => (
                              <Button
                                key={option}
                                onClick={() => handleSetCorrectAnswer(question.id, option)}
                                variant={question.correctAnswer === option ? "default" : "outline"}
                                className="w-full justify-start"
                              >
                                {option}
                              </Button>
                            ))
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
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
                  </div>
                );
              });
            })()
        )}
      </div>
    </div>
  );
}
