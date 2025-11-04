import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "./StatCard";
import { Sparkline } from "./Sparkline";
import { Trophy, TrendingUp, Target, Award, Home, Plane, Star, Loader2, CheckCircle2, AlertTriangle, XCircle, Zap } from "lucide-react";
import { statsAPI, type PersonalStatsData } from "@/lib/api/stats";

interface PersonalInsightsProps {
  userId: string;
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

export const PersonalInsights = ({ userId, squadId }: PersonalInsightsProps) => {
  const [stats, setStats] = useState<PersonalStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const [hoveredPattern, setHoveredPattern] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await statsAPI.getPersonalStats(userId, squadId);
        setStats(data);
      } catch (err) {
        console.error('Error fetching personal stats:', err);
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

  // Get performance tier colors
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 60) {
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

  const colors = getPerformanceColor(stats.winPercentage);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Performance Overview - Hero Card */}
      <Card className={`
        relative overflow-hidden border-2
        hover:shadow-xl transition-all duration-500
        bg-gradient-to-br ${colors.gradient} backdrop-blur-sm
        group
      `}>
        {/* Animated background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <div className={`absolute inset-0 ${colors.bg} blur-3xl`} />
        </div>

        <CardContent className="relative p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            {/* Main Stats */}
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
                    {stats.totalWins}-{stats.totalLosses}-{stats.totalPushes}
                  </p>
                  <p className={`text-lg sm:text-2xl font-bold ${colors.text} mt-1`}>
                    {stats.winPercentage}% win rate
                  </p>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${colors.bg}`}>
                    <Trophy className={`w-4 h-4 ${colors.icon}`} />
                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                      {stats.totalPicks} picks
                    </span>
                  </div>
                  {stats.bestWeek && (() => {
                    const [wins] = stats.bestWeek.record.split('-').map(Number);
                    if (wins === 3) {
                      return (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 ring-1 ring-amber-500/30">
                          <Zap className="w-4 h-4 text-amber-600" />
                          <span className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-300">
                            Perfect Week
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>

            {/* Best Week Badge */}
            {stats.bestWeek && (() => {
              const [wins, losses, pushes] = stats.bestWeek.record.split('-').map(Number);
              const totalGames = wins + losses + pushes;
              const winPercentage = totalGames > 0 ? Math.round(((wins + pushes * 0.5) / totalGames) * 100) : 0;

              return (
                <div className="w-full sm:w-auto">
                  <div className={`
                    relative p-4 sm:p-6 rounded-2xl
                    bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent
                    border-2 border-amber-200/60 dark:border-amber-500/40
                    shadow-lg
                    hover:scale-105 transition-transform duration-300
                  `}>
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-amber-500 text-white rounded-full p-2 animate-pulse shadow-lg">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                      Best Week
                    </p>
                    <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                      {winPercentage}%
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                      {stats.bestWeek.record} • {stats.bestWeek.weekId}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Favorite Teams - Interactive Grid */}
      <Card className="overflow-hidden border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-3 sm:pb-4 border-b border-border/50 bg-gradient-to-r from-yellow-500/5 to-transparent">
          <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-yellow-500/10">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-500" />
            </div>
            Your Favorite Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 sm:pt-4">
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {stats.favoriteTeams.slice(0, 3).map((team, index) => {
              const isHovered = hoveredTeam === team.team;
              const tierColor = team.winRate >= 60 ? 'text-green-600 dark:text-green-500' :
                                team.winRate >= 45 ? 'text-blue-600 dark:text-blue-500' :
                                'text-red-600 dark:text-red-500';

              return (
                <div
                  key={team.team}
                  onMouseEnter={() => setHoveredTeam(team.team)}
                  onMouseLeave={() => setHoveredTeam(null)}
                  className={`
                    flex items-center justify-between p-3 sm:p-4
                    bg-muted/30 rounded-xl border border-border/30
                    hover:bg-muted/60 hover:border-border/60 hover:shadow-md
                    transition-all duration-300 cursor-pointer
                    ${isHovered ? 'scale-[1.02] -translate-y-0.5' : ''}
                    group/team
                  `}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Rank Badge */}
                    <div className={`
                      flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full
                      flex items-center justify-center font-bold text-[10px] sm:text-xs
                      ${index === 0 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/30' :
                        index === 1 ? 'bg-slate-300/20 text-slate-700 dark:text-slate-400 ring-2 ring-slate-400/30' :
                        'bg-orange-500/20 text-orange-700 dark:text-orange-400 ring-2 ring-orange-500/30'}
                      group-hover/team:scale-110 transition-transform duration-300
                    `}>
                      {index + 1}
                    </div>

                    {/* Team Logo */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0 group-hover/team:scale-110 transition-transform duration-300">
                      <img
                        src={getTeamLogo(team.team)}
                        alt={team.team}
                        className="w-full h-full object-contain drop-shadow-md"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                    </div>

                    {/* Team Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm sm:text-base truncate text-foreground">
                        {team.team}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                        <span>{team.wins}-{team.losses}{team.pushes > 0 ? `-${team.pushes}` : ''}</span>
                        <span className="text-xs">•</span>
                        <span>{team.picks} picks</span>
                      </p>
                    </div>
                  </div>

                  {/* Win Rate Badge */}
                  <div className="flex-shrink-0 text-right">
                    <p className={`font-black text-sm sm:text-base ${tierColor}`}>
                      {team.winRate}%
                    </p>
                    {team.winRate >= 70 && (
                      <p className="text-xs sm:text-sm mt-0.5">🔥</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pick Patterns - Interactive */}
      <Card className="overflow-hidden border-0 shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-3 sm:pb-4 border-b border-border/50">
          <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Your Pick Patterns
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Home/Away Pattern */}
            <div
              onMouseEnter={() => setHoveredPattern('home-away')}
              onMouseLeave={() => setHoveredPattern(null)}
              className={`
                p-4 sm:p-6 rounded-2xl border border-border/30
                bg-gradient-to-br from-blue-500/5 via-green-500/5 to-transparent
                hover:border-border/60 hover:shadow-lg
                transition-all duration-300 cursor-pointer
                ${hoveredPattern === 'home-away' ? 'scale-[1.02]' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  <Plane className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground">Home vs Away</span>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Home */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Home</span>
                    <span className="text-sm sm:text-lg font-bold text-blue-600">{stats.pickPatterns.homeRate}%</span>
                  </div>
                  <div className="relative w-full bg-muted/50 rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${stats.pickPatterns.homeRate}%`,
                        transform: hoveredPattern === 'home-away' ? 'scaleY(1.2)' : 'scaleY(1)'
                      }}
                    />
                  </div>
                </div>

                {/* Away */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Away</span>
                    <span className="text-sm sm:text-lg font-bold text-green-600">{stats.pickPatterns.awayRate}%</span>
                  </div>
                  <div className="relative w-full bg-muted/50 rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${stats.pickPatterns.awayRate}%`,
                        transform: hoveredPattern === 'home-away' ? 'scaleY(1.2)' : 'scaleY(1)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Favorite/Underdog Pattern */}
            <div
              onMouseEnter={() => setHoveredPattern('fav-dog')}
              onMouseLeave={() => setHoveredPattern(null)}
              className={`
                p-4 sm:p-6 rounded-2xl border border-border/30
                bg-gradient-to-br from-yellow-500/5 via-purple-500/5 to-transparent
                hover:border-border/60 hover:shadow-lg
                transition-all duration-300 cursor-pointer
                ${hoveredPattern === 'fav-dog' ? 'scale-[1.02]' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground">Favorites vs Underdogs</span>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Favorites */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Favorites</span>
                    <span className="text-sm sm:text-lg font-bold text-yellow-600">{stats.pickPatterns.favoriteRate}%</span>
                  </div>
                  <div className="relative w-full bg-muted/50 rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${stats.pickPatterns.favoriteRate}%`,
                        transform: hoveredPattern === 'fav-dog' ? 'scaleY(1.2)' : 'scaleY(1)'
                      }}
                    />
                  </div>
                </div>

                {/* Underdogs */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Underdogs</span>
                    <span className="text-sm sm:text-lg font-bold text-purple-600">{stats.pickPatterns.underdogRate}%</span>
                  </div>
                  <div className="relative w-full bg-muted/50 rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${stats.pickPatterns.underdogRate}%`,
                        transform: hoveredPattern === 'fav-dog' ? 'scaleY(1.2)' : 'scaleY(1)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spread Performance - Compact & Interactive */}
      <Card className="overflow-hidden border-0 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-3 sm:pb-4 border-b border-border/50">
          <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Spread Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 sm:pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {stats.spreadPerformance.map((spread) => {
              const isGood = spread.winRate >= 60;
              const isOkay = spread.winRate >= 50 && spread.winRate < 60;

              const Icon = isGood ? CheckCircle2 : isOkay ? AlertTriangle : XCircle;
              const colorClass = isGood ? 'border-green-500/30 hover:border-green-500/50 hover:bg-green-500/10' :
                                 isOkay ? 'border-yellow-500/30 hover:border-yellow-500/50 hover:bg-yellow-500/10' :
                                 'border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10';
              const iconColor = isGood ? 'text-green-600' : isOkay ? 'text-yellow-600' : 'text-red-600';
              const barColor = isGood ? 'from-green-500 to-green-600' :
                              isOkay ? 'from-yellow-500 to-yellow-600' :
                              'from-red-500 to-red-600';

              return (
                <div
                  key={spread.range}
                  className={`
                    p-3 sm:p-4 rounded-xl border ${colorClass}
                    transition-all duration-300 cursor-pointer
                    hover:scale-[1.02] hover:shadow-md
                    group/spread
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${iconColor} group-hover/spread:scale-110 transition-transform`} />
                      <span className="text-xs sm:text-base font-semibold">{spread.range}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm sm:text-lg font-bold ${iconColor}`}>{spread.winRate}%</span>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{spread.wins}-{spread.losses}</p>
                    </div>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${spread.winRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
