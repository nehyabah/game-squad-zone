import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoundsManager from "./RoundsManager";
import MatchesManager from "./MatchesManager";
import QuestionsManager from "./QuestionsManager";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { roundsAPI, matchesAPI, questionsAPI } from "@/lib/api/six-nations";
import { useToast } from "@/hooks/use-toast";

export interface Round {
  id: string;
  roundNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Match {
  id: string;
  roundId: string;
  roundName?: string;
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
  completed: boolean;
}

export interface Question {
  id: string;
  matchId: string;
  matchDetails?: string;
  questionNumber: number;
  questionText: string;
  questionType: "multiple_choice" | "yes_no";
  options: string[] | null;
  correctAnswer: string | null;
  points: number;
}

export default function SixNationsManager() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState("rounds");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Use admin endpoints to get ALL data regardless of round activation status
      const [roundsData, matchesData, questionsData] = await Promise.all([
        roundsAPI.getAll(),
        matchesAPI.getAllAdmin(),
        questionsAPI.getAllAdmin(),
      ]);

      setRounds(roundsData);

      // Add roundName to matches
      const matchesWithRoundNames = matchesData.map(match => ({
        ...match,
        roundName: match.round?.name,
      }));
      setMatches(matchesWithRoundNames);

      // Add matchDetails to questions
      const questionsWithDetails = questionsData.map(q => ({
        ...q,
        matchDetails: q.match ? `${q.match.homeTeam} vs ${q.match.awayTeam}` : undefined,
      }));
      setQuestions(questionsWithDetails);
    } catch (error) {
      console.error("Error loading Six Nations data:", error);
      toast({
        title: "Error",
        description: "Failed to load Six Nations data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">6 Nations Management</h2>
          <p className="text-muted-foreground text-sm">
            Hierarchical setup: Rounds → Matches → Questions
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Setup Order:</strong> First create Rounds (5 total), then add Matches to each Round (3 per round),
          then create Questions for each Match (3 per match). This creates 45 total questions.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="rounds">
            Rounds {rounds.length > 0 && `(${rounds.length})`}
          </TabsTrigger>
          <TabsTrigger value="matches" disabled={rounds.length === 0}>
            Matches {matches.length > 0 && `(${matches.length})`}
          </TabsTrigger>
          <TabsTrigger value="questions" disabled={matches.length === 0}>
            Questions {questions.length > 0 && `(${questions.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rounds" className="mt-6">
          <RoundsManager
            rounds={rounds}
            setRounds={setRounds}
            onRoundCreated={() => setActiveTab("matches")}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="matches" className="mt-6">
          <MatchesManager
            rounds={rounds}
            matches={matches}
            setMatches={setMatches}
            onMatchCreated={() => setActiveTab("questions")}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="questions" className="mt-6">
          <QuestionsManager
            matches={matches}
            questions={questions}
            setQuestions={setQuestions}
            onRefresh={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
