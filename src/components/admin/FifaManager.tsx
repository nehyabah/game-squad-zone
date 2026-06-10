import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { fifaRoundsAPI, fifaMatchesAPI, fifaQuestionsAPI, FifaRound, FifaMatch, FifaQuestion } from "@/lib/api/fifa";
import { useToast } from "@/hooks/use-toast";
import FifaRoundsManager from "./FifaRoundsManager";
import FifaMatchesManager from "./FifaMatchesManager";
import FifaQuestionsManager from "./FifaQuestionsManager";

export default function FifaManager() {
  const [rounds, setRounds] = useState<FifaRound[]>([]);
  const [matches, setMatches] = useState<FifaMatch[]>([]);
  const [questions, setQuestions] = useState<FifaQuestion[]>([]);
  const [activeTab, setActiveTab] = useState("rounds");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roundsData, matchesData, questionsData] = await Promise.all([
        fifaRoundsAPI.getAll(),
        fifaMatchesAPI.getAllAdmin(),
        fifaQuestionsAPI.getAllAdmin(),
      ]);
      setRounds(roundsData);
      setMatches(matchesData.map((m) => ({ ...m, roundName: (m as any).round?.name })));
      setQuestions(questionsData.map((q) => ({
        ...q,
        matchDetails: `${(q as any).match?.homeTeam} vs ${(q as any).match?.awayTeam}`,
      })));
    } catch (error) {
      console.error("Failed to load FIFA data:", error);
      toast({ title: "Error", description: "Failed to load FIFA data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const activeRound = rounds.find((r) => r.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <img
          src="/2026_FIFA_World_Cup_emblem.svg.webp"
          alt="FIFA World Cup 2026"
          className="w-10 h-10 object-contain"
        />
        <div>
          <h2 className="text-2xl font-bold">FIFA World Cup 2026</h2>
          <p className="text-muted-foreground text-sm">Manage rounds, matches, and questions</p>
        </div>
      </div>

      {activeRound && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Active round: <strong>{activeRound.name}</strong> (Round {activeRound.roundNumber})
          </AlertDescription>
        </Alert>
      )}

      {!activeRound && rounds.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>No active round. Activate a round so players can see questions.</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rounds">Rounds ({rounds.length})</TabsTrigger>
          <TabsTrigger value="matches">Matches ({matches.length})</TabsTrigger>
          <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="rounds" className="mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <FifaRoundsManager rounds={rounds} setRounds={setRounds} onRefresh={loadData} />
          )}
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <FifaMatchesManager rounds={rounds} matches={matches} onRefresh={loadData} />
          )}
        </TabsContent>

        <TabsContent value="questions" className="mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <FifaQuestionsManager rounds={rounds} matches={matches} questions={questions} onRefresh={loadData} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
