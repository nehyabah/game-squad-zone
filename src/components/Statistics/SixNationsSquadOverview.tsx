import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "./StatCard";
import { Trophy, Target, CheckCircle2, Loader2, Crown, TrendingUp } from "lucide-react";
import { sixNationsStatsAPI, type SixNationsSquadStatsData } from "@/lib/api/six-nations";

interface SixNationsSquadOverviewProps {
  squadId: string;
}

export const SixNationsSquadOverview = ({ squadId }: SixNationsSquadOverviewProps) => {
  const [stats, setStats] = useState<SixNationsSquadStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await sixNationsStatsAPI.getSquadStats(squadId);
        setStats(data);
      } catch (err) {
        console.error('Error fetching six nations squad stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [squadId]);

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

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Squad Leader Card */}
      {stats.leader ? (
        <Card className="relative overflow-hidden border-2 border-amber-200/60 dark:border-amber-500/40 bg-gradient-to-br from-amber-50/80 via-yellow-50/60 to-orange-50/40 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/10 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] group">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 blur-2xl" />
          </div>
          <CardContent className="relative p-3 sm:p-6">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="relative p-2 sm:p-3 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 rounded-xl ring-2 ring-white/50 dark:ring-black/20 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <Crown className="w-5 h-5 sm:w-7 sm:h-7 text-amber-600 dark:text-amber-400 drop-shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <p className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-muted-foreground/80">
                      Squad Leader
                    </p>
                  </div>
                  <h3 className="text-base sm:text-2xl font-bold text-foreground truncate mb-1 sm:mb-1.5">
                    {stats.leader.displayName || stats.leader.username}
                  </h3>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-[9px] sm:text-xs text-muted-foreground font-medium">
                      Leading the pack
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-br from-amber-400/20 to-yellow-400/20 ring-1 ring-white/30 shadow-md">
                  <p className="text-2xl sm:text-4xl font-black text-amber-700 dark:text-amber-300 tracking-tight leading-none">
                    {stats.leader.totalPoints}
                  </p>
                  <p className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mt-0.5 sm:mt-1">
                    Points
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="relative overflow-hidden border-dashed border-2 border-muted-foreground/20">
          <CardContent className="p-2.5 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-muted/30 rounded-lg">
                <Crown className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground/40" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] sm:text-sm text-muted-foreground font-medium mb-0.5">Squad Leader</p>
                <p className="text-sm sm:text-lg text-muted-foreground">No answers yet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          title="Squad Accuracy"
          value={`${stats.squadAccuracy}%`}
          icon={Target}
          subtitle="Overall"
        />
        <StatCard
          title="Total Correct"
          value={stats.totalCorrect}
          icon={CheckCircle2}
          subtitle={`of ${stats.totalAnswered}`}
        />
        <StatCard
          title="Best Round"
          value={stats.bestRound ? `${stats.bestRound.accuracy}%` : 'N/A'}
          icon={Trophy}
          subtitle={stats.bestRound?.roundName || ''}
        />
      </div>

      {/* Per-Round Accuracy Bars */}
      {stats.rounds.length > 0 && (
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950 backdrop-blur-md">
          <CardHeader className="pb-4 sm:pb-5 border-b border-border/30 bg-gradient-to-r from-slate-50/80 to-transparent dark:from-slate-900/80">
            <CardTitle className="text-base sm:text-xl font-bold">Round-by-Round Accuracy</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-5">
            <div className="space-y-2 sm:space-y-3">
              {stats.rounds.map((round) => (
                <div
                  key={round.roundName}
                  className="group flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-background/60 to-muted/20 hover:from-background hover:to-muted/40 rounded-2xl border border-border/20 hover:border-border/40 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-300">
                      {round.roundNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-base font-bold truncate">{round.roundName}</p>
                      <p className="text-[10px] sm:text-sm text-muted-foreground">
                        {round.totalCorrect}/{round.totalScored} correct
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                    <div className="w-16 sm:w-24 bg-muted/50 rounded-full h-1.5 sm:h-2 overflow-hidden">
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
                    <p className={`text-sm sm:text-lg font-black min-w-[3ch] text-right ${
                      round.accuracy >= 70 ? 'text-green-600 dark:text-green-500' :
                      round.accuracy >= 50 ? 'text-blue-600 dark:text-blue-500' :
                      'text-amber-600 dark:text-amber-500'
                    }`}>
                      {round.accuracy}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
