import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, Loader2, TrendingUp } from "lucide-react";
import { sixNationsStatsAPI, type SixNationsPersonalStatsData } from "@/lib/api/six-nations";

interface SixNationsPersonalInsightsProps {
  userId: string;
  squadId: string;
}

export const SixNationsPersonalInsights = ({ userId, squadId }: SixNationsPersonalInsightsProps) => {
  const [stats, setStats] = useState<SixNationsPersonalStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await sixNationsStatsAPI.getPersonalStats(userId, squadId);
        setStats(data);
      } catch (err) {
        console.error('Error fetching six nations personal stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId, squadId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="py-8 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No statistics available</p>
        </CardContent>
      </Card>
    );
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 70) {
      return {
        gradient: "from-green-500/20 via-emerald-500/10 to-transparent",
        text: "text-green-600 dark:text-green-400",
        icon: "text-green-600 dark:text-green-500",
        bg: "bg-green-500/10"
      };
    } else if (percentage >= 50) {
      return {
        gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
        text: "text-blue-600 dark:text-blue-400",
        icon: "text-blue-600 dark:text-blue-500",
        bg: "bg-blue-500/10"
      };
    } else {
      return {
        gradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
        text: "text-amber-600 dark:text-amber-400",
        icon: "text-amber-600 dark:text-amber-500",
        bg: "bg-amber-500/10"
      };
    }
  };

  const colors = getPerformanceColor(stats.accuracy);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Performance Card */}
      <Card className={`relative overflow-hidden border-2 hover:shadow-xl transition-all duration-500 bg-gradient-to-br ${colors.gradient} backdrop-blur-sm group`}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <div className={`absolute inset-0 ${colors.bg} blur-3xl`} />
        </div>

        <CardContent className="relative p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${colors.bg} ring-2 ring-white/30 dark:ring-black/20`}>
                  <Target className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.icon}`} />
                </div>
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Performance
                </span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-4xl sm:text-6xl font-black text-foreground tracking-tight">
                    {stats.totalPoints}
                  </p>
                  <p className={`text-lg sm:text-2xl font-bold ${colors.text} mt-1`}>
                    Total Points
                  </p>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${colors.bg}`}>
                    <Target className={`w-4 h-4 ${colors.icon}`} />
                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                      {stats.accuracy}% accuracy
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30">
                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                      {stats.correct}C - {stats.incorrect}I
                    </span>
                  </div>
                  {stats.pending > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10">
                      <span className="text-xs sm:text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                        {stats.pending} pending
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Best Round Badge */}
            {stats.bestRound && (
              <div className="w-full sm:w-auto">
                <div className="relative p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent border-2 border-amber-200/60 dark:border-amber-500/40 shadow-lg hover:scale-105 transition-transform duration-300">
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-amber-500 text-white rounded-full p-2 animate-pulse shadow-lg">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                    Best Round
                  </p>
                  <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                    {stats.bestRound.accuracy}%
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                    {stats.bestRound.roundName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Per-Round Breakdown */}
      {stats.rounds.length > 0 && (
        <Card className="overflow-hidden border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-3 sm:pb-4 border-b border-border/50">
            <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Round-by-Round Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 sm:pt-4">
            <div className="space-y-2 sm:space-y-3">
              {stats.rounds.map((round) => {
                const isBest = stats.bestRound?.roundName === round.roundName;
                const isWorst = stats.worstRound?.roundName === round.roundName && stats.rounds.length > 1;

                return (
                  <div
                    key={round.roundName}
                    className={`p-3 sm:p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
                      isBest
                        ? 'border-green-500/30 bg-green-500/5'
                        : isWorst
                        ? 'border-red-500/30 bg-red-500/5'
                        : 'border-border/30 bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-base font-bold">{round.roundName}</span>
                        {isBest && <Badge variant="outline" className="text-[8px] sm:text-[10px] border-green-500/50 text-green-600">Best</Badge>}
                        {isWorst && <Badge variant="outline" className="text-[8px] sm:text-[10px] border-red-500/50 text-red-600">Worst</Badge>}
                      </div>
                      <div className="text-right">
                        <span className="text-sm sm:text-lg font-black">{round.points}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">pts</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted/50 rounded-full h-1.5 sm:h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            round.accuracy >= 70
                              ? 'bg-gradient-to-r from-green-500 to-green-600'
                              : round.accuracy >= 50
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600'
                          }`}
                          style={{ width: `${round.accuracy}%` }}
                        />
                      </div>
                      <span className={`text-xs sm:text-sm font-bold min-w-[3ch] text-right ${
                        round.accuracy >= 70 ? 'text-green-600' :
                        round.accuracy >= 50 ? 'text-blue-600' :
                        'text-amber-600'
                      }`}>
                        {round.accuracy}%
                      </span>
                    </div>
                    <p className="text-[9px] sm:text-xs text-muted-foreground mt-1">
                      {round.correct} correct, {round.incorrect} incorrect
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
