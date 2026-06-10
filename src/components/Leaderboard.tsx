import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy } from "lucide-react";
import { getDisplayName, getInitials } from "@/lib/utils/user";
import {
  useSeasonLeaderboard,
  useWeeklyLeaderboard,
} from "@/hooks/use-leaderboard";
import { useAuth } from "@/hooks/use-auth";
import { useSport } from "@/hooks/use-sport";
import { getCurrentWeekIdSync } from "@/lib/utils/weekUtils";
import { leaderboardAPI, SixNationsLeaderboardEntry } from "@/lib/api/six-nations";
import { fifaLeaderboardAPI, FifaLeaderboardEntry } from "@/lib/api/fifa";

interface LeaderboardDisplayEntry {
  rank: number;
  username: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  wins: number;
  losses: number;
  pushes: number;
  winPercentage: number;
  points: number;
  isCurrentUser?: boolean;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="w-5 h-5 flex-shrink-0 text-amber-400 drop-shadow-[0_1px_4px_rgba(251,191,36,0.7)]" />;
  if (rank === 2) return <Trophy className="w-4 h-4 flex-shrink-0 text-slate-400" />;
  if (rank === 3) return <Trophy className="w-4 h-4 flex-shrink-0 text-amber-700/80" />;
  return (
    <span className="w-5 flex items-center justify-center text-xs font-semibold text-muted-foreground/60 tabular-nums flex-shrink-0">
      {rank}
    </span>
  );
};

const LeaderboardTable = ({ data, isSixNations = false }: { data: LeaderboardDisplayEntry[]; isSixNations?: boolean }) => (
  <div className="bg-card border border-border rounded-lg shadow-sm">
    <div className="p-3 border-b border-border">
      <h3 className="font-semibold text-sm text-foreground">Rankings</h3>
    </div>
    <div
      className="divide-y divide-border max-h-[60vh] sm:max-h-[70vh] overflow-y-auto scroll-smooth pb-2"
      style={{ scrollbarWidth: "thin" }}
    >
      {data.map((entry, index) => (
        <div
          key={entry.rank}
          className={`flex items-center justify-between p-2 sm:p-4 hover:bg-muted/50 transition-colors ${
            entry.isCurrentUser
              ? "bg-primary/5 border-l-2 border-l-primary"
              : ""
          } ${
            index === 0 ? "bg-gradient-to-r from-yellow-50 to-transparent" : ""
          } ${
            index === 1 ? "bg-gradient-to-r from-gray-50 to-transparent" : ""
          } ${
            index === 2 ? "bg-gradient-to-r from-orange-50 to-transparent" : ""
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
              {getRankIcon(entry.rank)}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                <div
                  className={`text-xs sm:text-sm font-medium truncate ${
                    entry.isCurrentUser ? "text-primary" : "text-foreground"
                  }`}
                >
                  {getDisplayName({
                    username: entry.username,
                    displayName: entry.displayName,
                    firstName: entry.firstName,
                    lastName: entry.lastName,
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="sm:hidden">
                    {entry.wins}W-{entry.losses}L
                    {entry.pushes > 0 ? `-${entry.pushes}${isSixNations ? 'P' : 'D'}` : ""}
                  </span>
                  <span className="hidden sm:inline">
                    {entry.wins}W {entry.losses}L {entry.pushes > 0 ? `${entry.pushes}${isSixNations ? 'P' : 'D'}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
            {/* Show W% only for NFL */}
            {!isSixNations && (
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-foreground">
                  {entry.winPercentage}%
                </div>
                <div className="text-xs text-muted-foreground">W%</div>
              </div>
            )}

            <div className="text-right">
              <div className="font-bold text-primary text-sm sm:text-base">
                {entry.points}
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                Points
              </div>
              <div className="text-xs text-muted-foreground sm:hidden">pts</div>
            </div>

            {/* Mobile win percentage - only for NFL */}
            {!isSixNations && (
              <div className="text-right sm:hidden">
                <div className="text-xs text-muted-foreground">
                  {entry.winPercentage}%
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FifaEmptyState = () => (
  <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
    <img src="/2026_FIFA_World_Cup_emblem.svg.webp" alt="FIFA" className="w-12 h-12 object-contain opacity-50" />
    <div className="space-y-1">
      <p className="font-semibold text-sm">No scores yet</p>
      <p className="text-xs text-muted-foreground">Be the first to submit your picks!</p>
    </div>
  </div>
);

const FifaLeaderboardTable = ({ data, currentUserId }: { data: LeaderboardDisplayEntry[]; currentUserId?: string }) => {
  const myEntry = data.find((e) => e.isCurrentUser);
  return (
    <div className="space-y-2">
      {myEntry && myEntry.rank > 10 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-black text-primary">#{myEntry.rank}</span>
            <span className="text-sm font-semibold">You</span>
          </div>
          <span className="text-sm font-black text-primary">{myEntry.points} pts</span>
        </div>
      )}
      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        {data.slice(0, 15).map((entry, idx) => (
          <div
            key={entry.rank}
            className={[
              "flex items-center gap-3 px-4 py-3 border-b last:border-0 transition-colors",
              entry.isCurrentUser ? "bg-primary/5" : "",
              !entry.isCurrentUser && idx === 0 ? "bg-gradient-to-r from-yellow-50/80 to-transparent dark:from-yellow-900/10" : "",
              !entry.isCurrentUser && idx === 1 ? "bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/20" : "",
              !entry.isCurrentUser && idx === 2 ? "bg-gradient-to-r from-orange-50/60 to-transparent dark:from-orange-900/10" : "",
            ].filter(Boolean).join(" ")}
          >
            <div className="flex-shrink-0 w-6 flex items-center justify-center">{getRankIcon(entry.rank)}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold leading-none truncate ${entry.isCurrentUser ? "text-primary" : ""}`}>
                {entry.isCurrentUser ? "You" : getDisplayName({ username: entry.username, displayName: entry.displayName, firstName: entry.firstName, lastName: entry.lastName })}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                {entry.wins}✓&nbsp;{entry.losses}✗&nbsp;{entry.pushes}⏳
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className={`text-sm font-black tabular-nums ${idx < 3 || entry.isCurrentUser ? "text-primary" : "text-foreground"}`}>
                {entry.points}
              </p>
              <p className="text-[10px] text-muted-foreground">pts</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("week");
  const { user } = useAuth();
  const { selectedSport } = useSport();

  // Six Nations leaderboard state
  const [sixNationsData, setSixNationsData] = useState<SixNationsLeaderboardEntry[]>([]);
  const [sixNationsLoading, setSixNationsLoading] = useState(false);
  const [sixNationsError, setSixNationsError] = useState<string | null>(null);
  const [sixNationsTotalData, setSixNationsTotalData] = useState<SixNationsLeaderboardEntry[]>([]);
  const [sixNationsTotalLoading, setSixNationsTotalLoading] = useState(false);
  const [sixNationsTotalError, setSixNationsTotalError] = useState<string | null>(null);
  const [sixNationsTab, setSixNationsTab] = useState("round");

  // FIFA leaderboard state
  const [fifaData, setFifaData] = useState<FifaLeaderboardEntry[]>([]);
  const [fifaLoading, setFifaLoading] = useState(false);
  const [fifaError, setFifaError] = useState<string | null>(null);
  const [fifaTotalData, setFifaTotalData] = useState<FifaLeaderboardEntry[]>([]);
  const [fifaTotalLoading, setFifaTotalLoading] = useState(false);
  const [fifaTotalError, setFifaTotalError] = useState<string | null>(null);
  const [fifaTab, setFifaTab] = useState("round");

  // Get current week ID dynamically
  const currentWeekId = getCurrentWeekIdSync();
  const seasonLeaderboard = useSeasonLeaderboard();
  const weeklyLeaderboard = useWeeklyLeaderboard(currentWeekId);

  // Load Six Nations leaderboards
  useEffect(() => {
    if (selectedSport === "six-nations") {
      loadSixNationsLeaderboard();
      loadSixNationsTotalLeaderboard();
    }
  }, [selectedSport]);

  // Load FIFA leaderboards
  useEffect(() => {
    if (selectedSport === "fifa") {
      loadFifaLeaderboard();
      loadFifaTotalLeaderboard();
    }
  }, [selectedSport]);

  const loadSixNationsLeaderboard = async () => {
    setSixNationsLoading(true);
    setSixNationsError(null);
    try {
      const data = await leaderboardAPI.get();
      setSixNationsData(data);
    } catch (error) {
      console.error("Error loading Six Nations leaderboard:", error);
      setSixNationsError("Failed to load leaderboard");
    } finally {
      setSixNationsLoading(false);
    }
  };

  const loadSixNationsTotalLeaderboard = async () => {
    setSixNationsTotalLoading(true);
    setSixNationsTotalError(null);
    try {
      const data = await leaderboardAPI.get(undefined, 'total');
      setSixNationsTotalData(data);
    } catch (error) {
      console.error("Error loading Six Nations total leaderboard:", error);
      setSixNationsTotalError("Failed to load leaderboard");
    } finally {
      setSixNationsTotalLoading(false);
    }
  };

  const loadFifaLeaderboard = async () => {
    setFifaLoading(true);
    setFifaError(null);
    try {
      const data = await fifaLeaderboardAPI.get();
      setFifaData(data);
    } catch (error) {
      console.error("Error loading FIFA leaderboard:", error);
      setFifaError("Failed to load leaderboard");
    } finally {
      setFifaLoading(false);
    }
  };

  const loadFifaTotalLeaderboard = async () => {
    setFifaTotalLoading(true);
    setFifaTotalError(null);
    try {
      const data = await fifaLeaderboardAPI.get(undefined, 'total');
      setFifaTotalData(data);
    } catch (error) {
      console.error("Error loading FIFA total leaderboard:", error);
      setFifaTotalError("Failed to load leaderboard");
    } finally {
      setFifaTotalLoading(false);
    }
  };

  // Transform API data to display format and mark current user
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const transformLeaderboardData = (
    apiData: any[]
  ): LeaderboardDisplayEntry[] => {
    return apiData.map((entry) => ({
      ...entry,
      isCurrentUser: user ? entry.userId === user.id : false,
    }));
  };

  // Transform Six Nations data to display format
  const transformSixNationsData = (
    apiData: SixNationsLeaderboardEntry[]
  ): LeaderboardDisplayEntry[] => {
    // Sort by points descending, then by correct answers descending
    const sortedData = [...apiData].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return b.correctAnswers - a.correctAnswers;
    });

    return sortedData.map((entry, index) => {
      // Calculate weighted score: average points per answer (more meaningful than W%)
      // This rewards both accuracy AND picking harder questions correctly
      const avgPointsPerAnswer = entry.totalAnswers > 0
        ? Math.round((entry.totalPoints / entry.totalAnswers) * 10) / 10
        : 0;

      // For display consistency, convert to a "score out of 100" style number
      // Assuming max points per question is around 5, scale accordingly
      // This gives a weighted score that reflects both quantity and quality
      const weightedScore = Math.round(avgPointsPerAnswer * 10);

      // Calculate pending answers (not yet scored)
      const pendingAnswers = entry.totalAnswers - entry.correctAnswers - entry.incorrectAnswers;

      return {
        rank: index + 1, // Recalculate rank based on sorted order
        username: entry.user.username,
        displayName: entry.user.displayName,
        firstName: entry.user.firstName,
        lastName: entry.user.lastName,
        wins: entry.correctAnswers,
        losses: entry.incorrectAnswers,
        pushes: pendingAnswers, // Use pending answers as "pushes" to show something is waiting
        winPercentage: weightedScore, // Display weighted score instead of W%
        points: entry.totalPoints,
        isCurrentUser: user ? entry.user.id === user.id : false,
      };
    });
  };

  const transformFifaData = (apiData: FifaLeaderboardEntry[]): LeaderboardDisplayEntry[] => {
    return [...apiData]
      .sort((a, b) => b.totalPoints !== a.totalPoints ? b.totalPoints - a.totalPoints : b.correctAnswers - a.correctAnswers)
      .map((entry, index) => {
        const pending = entry.totalAnswers - entry.correctAnswers - entry.incorrectAnswers;
        return {
          rank: index + 1,
          username: entry.user.username,
          displayName: entry.user.displayName,
          firstName: entry.user.firstName,
          lastName: entry.user.lastName,
          wins: entry.correctAnswers,
          losses: entry.incorrectAnswers,
          pushes: pending,
          winPercentage: 0,
          points: entry.totalPoints,
          isCurrentUser: user ? entry.user.id === user.id : false,
        };
      });
  };

  const weeklyData = transformLeaderboardData(weeklyLeaderboard.data);
  const seasonData = transformLeaderboardData(seasonLeaderboard.data);
  const sixNationsDisplayData = transformSixNationsData(sixNationsData);
  const sixNationsTotalDisplayData = transformSixNationsData(sixNationsTotalData);
  const fifaDisplayData = transformFifaData(fifaData);
  const fifaTotalDisplayData = transformFifaData(fifaTotalData);

  // Show Six Nations leaderboard if viewing Six Nations
  if (selectedSport === "six-nations") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Six Nations Leaderboard
          </h2>
          <p className="text-muted-foreground">
            Overall tournament standings
          </p>
        </div>

        <Tabs value={sixNationsTab} onValueChange={setSixNationsTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto mb-6">
            <TabsTrigger value="round">Current Round</TabsTrigger>
            <TabsTrigger value="total">Total</TabsTrigger>
          </TabsList>

          <TabsContent value="round">
            {sixNationsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading leaderboard...</span>
              </div>
            ) : sixNationsError ? (
              <div className="text-center p-8 text-red-600">
                <p>Error: {sixNationsError}</p>
                <button
                  onClick={loadSixNationsLeaderboard}
                  className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
                >
                  Retry
                </button>
              </div>
            ) : sixNationsDisplayData.length === 0 ? (
              <Card className="bg-muted/30 border-border">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No scores yet. Be the first to submit your picks!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <LeaderboardTable data={sixNationsDisplayData} isSixNations={true} />
            )}
          </TabsContent>

          <TabsContent value="total">
            {sixNationsTotalLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading leaderboard...</span>
              </div>
            ) : sixNationsTotalError ? (
              <div className="text-center p-8 text-red-600">
                <p>Error: {sixNationsTotalError}</p>
                <button
                  onClick={loadSixNationsTotalLeaderboard}
                  className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
                >
                  Retry
                </button>
              </div>
            ) : sixNationsTotalDisplayData.length === 0 ? (
              <Card className="bg-muted/30 border-border">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No scores yet. Be the first to submit your picks!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <LeaderboardTable data={sixNationsTotalDisplayData} isSixNations={true} />
            )}
          </TabsContent>
        </Tabs>

        {/* Points System Info */}
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>
                <strong>Scoring:</strong> Points are awarded based on question difficulty
                • Total points = Sum of all correct answers
              </p>
              <p className="mt-2">
                <strong>Record:</strong> W = Correct • L = Incorrect • P = Pending
                <br />
                <strong>Ranking:</strong> Higher points = better (rewards difficulty)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show FIFA leaderboard if viewing FIFA
  if (selectedSport === "fifa") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d1829] via-[#091420] to-[#060d1a]" />
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-emerald-500/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-8 w-32 h-32 rounded-full bg-sky-600/15 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
          <div className="relative px-5 py-4 flex items-center gap-4">
            <img
              src="/2026_FIFA_World_Cup_emblem.svg.webp"
              alt="FIFA WC 2026"
              className="w-12 h-12 object-contain flex-shrink-0 drop-shadow-lg"
            />
            <div>
              <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Global Rankings</p>
              <h2 className="text-white font-black text-xl leading-none tracking-tight">World Cup 2026</h2>
            </div>
          </div>
        </div>

        <Tabs value={fifaTab} onValueChange={setFifaTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="round" className="flex-1">Current Round</TabsTrigger>
            <TabsTrigger value="total" className="flex-1">Overall</TabsTrigger>
          </TabsList>

          <TabsContent value="round" className="mt-3">
            {fifaLoading ? (
              <div className="flex items-center justify-center py-10 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading…</span>
              </div>
            ) : fifaError ? (
              <div className="text-center py-8">
                <p className="text-sm text-destructive mb-3">{fifaError}</p>
                <button onClick={loadFifaLeaderboard} className="text-xs text-primary underline">Retry</button>
              </div>
            ) : fifaDisplayData.length === 0 ? (
              <FifaEmptyState />
            ) : (
              <FifaLeaderboardTable data={fifaDisplayData} currentUserId={user?.id} />
            )}
          </TabsContent>

          <TabsContent value="total" className="mt-3">
            {fifaTotalLoading ? (
              <div className="flex items-center justify-center py-10 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading…</span>
              </div>
            ) : fifaTotalError ? (
              <div className="text-center py-8">
                <p className="text-sm text-destructive mb-3">{fifaTotalError}</p>
                <button onClick={loadFifaTotalLeaderboard} className="text-xs text-primary underline">Retry</button>
              </div>
            ) : fifaTotalDisplayData.length === 0 ? (
              <FifaEmptyState />
            ) : (
              <FifaLeaderboardTable data={fifaTotalDisplayData} currentUserId={user?.id} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // NFL leaderboard
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Global Leaderboard
        </h2>
        <p className="text-muted-foreground">
          See how you stack up against the competition
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto mb-6">
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="season">Season Total</TabsTrigger>
        </TabsList>

        <TabsContent value="week">
          {weeklyLeaderboard.loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading weekly leaderboard...</span>
            </div>
          ) : weeklyLeaderboard.error ? (
            <div className="text-center p-8 text-red-600">
              <p>Error loading weekly leaderboard: {weeklyLeaderboard.error}</p>
              <button
                onClick={weeklyLeaderboard.refetch}
                className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
              >
                Retry
              </button>
            </div>
          ) : (
            <LeaderboardTable data={weeklyData} />
          )}
        </TabsContent>

        <TabsContent value="season">
          {seasonLeaderboard.loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading season leaderboard...</span>
            </div>
          ) : seasonLeaderboard.error ? (
            <div className="text-center p-8 text-red-600">
              <p>Error loading season leaderboard: {seasonLeaderboard.error}</p>
              <button
                onClick={seasonLeaderboard.refetch}
                className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
              >
                Retry
              </button>
            </div>
          ) : (
            <LeaderboardTable data={seasonData} />
          )}
        </TabsContent>
      </Tabs>

      {/* Points System Info */}
      <Card className="bg-muted/30 border-border">
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              <strong>Points System:</strong> Win = 1 point • Draw = 0.5 points
              • Win% = (Wins + Draws/2) ÷ Total Games
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
