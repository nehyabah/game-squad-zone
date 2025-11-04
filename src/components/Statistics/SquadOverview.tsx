import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "./StatCard";
import { SquadLeaderCard } from "./SquadLeaderCard";
import { TopTeamCard } from "./TopTeamCard";
import { Trophy, Target, Loader2 } from "lucide-react";
import { statsAPI, type SquadStatsData } from "@/lib/api/stats";

interface SquadOverviewProps {
  squadId: string;
}

// Helper function to get team logos
const getTeamLogo = (teamName: string) => {
  const teamLogos: Record<string, string> = {
    'Buffalo Bills': 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png',
    'Miami Dolphins': 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png',
    'New England Patriots': 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png',
    'New York Jets': 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png',
    'Baltimore Ravens': 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png',
    'Cincinnati Bengals': 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png',
    'Cleveland Browns': 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png',
    'Pittsburgh Steelers': 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png',
    'Houston Texans': 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png',
    'Indianapolis Colts': 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png',
    'Jacksonville Jaguars': 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png',
    'Tennessee Titans': 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png',
    'Denver Broncos': 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png',
    'Kansas City Chiefs': 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
    'Las Vegas Raiders': 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png',
    'Los Angeles Chargers': 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png',
    'Dallas Cowboys': 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png',
    'New York Giants': 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png',
    'Philadelphia Eagles': 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png',
    'Washington Commanders': 'https://a.espncdn.com/i/teamlogos/nfl/500/was.png',
    'Chicago Bears': 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png',
    'Detroit Lions': 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png',
    'Green Bay Packers': 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png',
    'Minnesota Vikings': 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png',
    'Atlanta Falcons': 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png',
    'Carolina Panthers': 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png',
    'New Orleans Saints': 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png',
    'Tampa Bay Buccaneers': 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png',
    'Arizona Cardinals': 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png',
    'Los Angeles Rams': 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png',
    'San Francisco 49ers': 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png',
    'Seattle Seahawks': 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png'
  };
  return teamLogos[teamName] || 'https://a.espncdn.com/i/teamlogos/nfl/500/nfl.png';
};

export const SquadOverview = ({ squadId }: SquadOverviewProps) => {
  const [stats, setStats] = useState<SquadStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await statsAPI.getSquadStats(squadId);
        setStats(data);
      } catch (err) {
        console.error('Error fetching squad stats:', err);
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

  // Calculate derived stats from the API data
  const totalPicks = stats.mostPickedTeams.reduce((sum, team) => sum + team.picks, 0);
  const totalWins = stats.mostPickedTeams.reduce((sum, team) => sum + team.wins, 0);
  const totalLosses = stats.mostPickedTeams.reduce((sum, team) => sum + team.losses, 0);
  const totalPushes = stats.mostPickedTeams.reduce((sum, team) => sum + team.pushes, 0);
  const squadWinRate = totalPicks > 0 ? Math.round(((totalWins + totalPushes * 0.5) / totalPicks) * 100) : 0;
  const topTeam = stats.mostPickedTeams[0] || { team: "N/A", picks: 0, winRate: 0 };

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Squad Leader - Featured Card */}
      <SquadLeaderCard leader={stats.leader} />

      {/* Top Team - Featured Card */}
      <TopTeamCard team={topTeam} getTeamLogo={getTeamLogo} />

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <StatCard
          title="Squad W/L"
          value={`${totalWins}-${totalLosses}`}
          icon={Trophy}
          subtitle={`${squadWinRate}% win rate`}
        />
        <StatCard
          title="Total Picks"
          value={totalPicks}
          icon={Target}
          subtitle="All time"
        />
      </div>

      {/* Most Picked Teams - Modern sleek design */}
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950 backdrop-blur-md">
        <CardHeader className="pb-4 sm:pb-5 border-b border-border/30 bg-gradient-to-r from-slate-50/80 to-transparent dark:from-slate-900/80">
          <CardTitle className="text-base sm:text-xl font-bold">Most Picked Teams</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-5">
          <div className="space-y-2 sm:space-y-3">
            {stats.mostPickedTeams.slice(0, 5).map((team, index) => (
              <div
                key={team.team}
                className="group flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-background/60 to-muted/20 hover:from-background hover:to-muted/40 rounded-2xl border border-border/20 hover:border-border/40 hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  {/* Rank indicator */}
                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform">
                    {index + 1}
                  </div>

                  <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <img
                      src={getTeamLogo(team.team)}
                      alt={team.team}
                      className="w-full h-full object-contain drop-shadow-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-base font-bold truncate">{team.team}</p>
                    <p className="text-[10px] sm:text-sm text-muted-foreground flex items-center gap-1.5">
                      <span>{team.wins}-{team.losses}{team.pushes > 0 ? `-${team.pushes}` : ''}</span>
                      <span className="text-xs">•</span>
                      <span>{team.picks} picks</span>
                    </p>
                  </div>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className={`text-sm sm:text-lg font-black ${
                    team.winRate >= 60 ? 'text-green-600 dark:text-green-500' :
                    team.winRate >= 45 ? 'text-blue-600 dark:text-blue-500' :
                    'text-red-600 dark:text-red-500'
                  }`}>
                    {team.winRate}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pick Patterns - Modern sleek design */}
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950 backdrop-blur-md">
        <CardHeader className="pb-3 sm:pb-5 border-b border-border/30 bg-gradient-to-r from-slate-50/80 to-transparent dark:from-slate-900/80">
          <CardTitle className="text-sm sm:text-xl font-bold">Squad Pick Patterns</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 sm:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
            {/* Home vs Away */}
            <div className="p-3 sm:p-5 bg-gradient-to-br from-blue-500/5 via-green-500/5 to-transparent rounded-2xl border border-border/20 hover:border-border/40 hover:shadow-lg transition-all duration-300 group">
              <h4 className="text-xs sm:text-base font-bold mb-2 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-green-500" />
                <span>Home vs Away</span>
              </h4>
              <div className="space-y-2.5 sm:space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] sm:text-sm">
                    <span className="text-muted-foreground">Home</span>
                    <span className="font-bold text-blue-600">{stats.pickPatterns.homeRate}%</span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-1 sm:h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.pickPatterns.homeRate}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] sm:text-sm">
                    <span className="text-muted-foreground">Away</span>
                    <span className="font-bold text-green-600">{stats.pickPatterns.awayRate}%</span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-1 sm:h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.pickPatterns.awayRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Favorite vs Underdog */}
            <div className="p-3 sm:p-5 bg-gradient-to-br from-yellow-500/5 via-purple-500/5 to-transparent rounded-2xl border border-border/20 hover:border-border/40 hover:shadow-lg transition-all duration-300 group">
              <h4 className="text-xs sm:text-base font-bold mb-2 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-purple-500" />
                <span>Fav vs Dog</span>
              </h4>
              <div className="space-y-2.5 sm:space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] sm:text-sm">
                    <span className="text-muted-foreground">Favorites</span>
                    <span className="font-bold text-yellow-600">{stats.pickPatterns.favoriteRate}%</span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-1 sm:h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.pickPatterns.favoriteRate}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] sm:text-sm">
                    <span className="text-muted-foreground">Underdogs</span>
                    <span className="font-bold text-purple-600">{stats.pickPatterns.underdogRate}%</span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-1 sm:h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.pickPatterns.underdogRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Spread Distribution */}
            <div className="p-3 sm:p-5 bg-gradient-to-br from-slate-500/5 to-transparent rounded-2xl border border-border/20 hover:border-border/40 hover:shadow-lg transition-all duration-300">
              <h4 className="text-xs sm:text-base font-bold mb-2 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400" />
                <span>Spread Range</span>
              </h4>
              <div className="space-y-1.5 sm:space-y-3">
                {stats.spreadDistribution.map((spread, index) => (
                  <div key={spread.range} className="flex justify-between text-[10px] sm:text-sm p-1.5 sm:p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <span className="text-muted-foreground font-medium">{spread.range}</span>
                    <span className="font-bold text-foreground">{spread.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
