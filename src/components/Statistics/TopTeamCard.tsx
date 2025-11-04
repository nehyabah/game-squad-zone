import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target } from "lucide-react";

interface TopTeamCardProps {
  team: {
    team: string;
    picks: number;
    wins: number;
    losses: number;
    pushes: number;
    winRate: number;
  };
  getTeamLogo: (teamName: string) => string;
}

export const TopTeamCard = ({ team, getTeamLogo }: TopTeamCardProps) => {
  if (!team || team.team === "N/A") {
    return (
      <Card className="relative overflow-hidden border-dashed border-2 border-muted-foreground/20">
        <CardContent className="p-2.5 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-muted/30 rounded-lg">
              <Target className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground/40" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] sm:text-sm text-muted-foreground font-medium mb-0.5">
                Top Team
              </p>
              <p className="text-sm sm:text-lg text-muted-foreground">
                No picks yet
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get performance color based on win rate
  const getPerformanceColor = (winRate: number) => {
    if (winRate >= 60) {
      return {
        bg: "bg-gradient-to-br from-emerald-50/80 via-green-50/60 to-teal-50/40 dark:from-emerald-950/30 dark:via-green-950/20 dark:to-teal-950/10",
        border: "border-emerald-200/60 dark:border-emerald-500/40",
        accent: "bg-gradient-to-br from-emerald-500/20 to-green-500/20 dark:from-emerald-500/30 dark:to-green-500/30",
        text: "text-emerald-700 dark:text-emerald-300",
        iconColor: "text-emerald-600 dark:text-emerald-400"
      };
    } else if (winRate >= 45) {
      return {
        bg: "bg-gradient-to-br from-indigo-50/80 via-blue-50/60 to-violet-50/40 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-violet-950/10",
        border: "border-indigo-200/60 dark:border-indigo-500/40",
        accent: "bg-gradient-to-br from-indigo-500/20 to-blue-500/20 dark:from-indigo-500/30 dark:to-blue-500/30",
        text: "text-indigo-700 dark:text-indigo-300",
        iconColor: "text-indigo-600 dark:text-indigo-400"
      };
    } else {
      return {
        bg: "bg-gradient-to-br from-rose-50/80 via-red-50/60 to-pink-50/40 dark:from-rose-950/30 dark:via-red-950/20 dark:to-pink-950/10",
        border: "border-rose-200/60 dark:border-rose-500/40",
        accent: "bg-gradient-to-br from-rose-500/20 to-red-500/20 dark:from-rose-500/30 dark:to-red-500/30",
        text: "text-rose-700 dark:text-rose-300",
        iconColor: "text-rose-600 dark:text-rose-400"
      };
    }
  };

  const colors = getPerformanceColor(team.winRate);

  return (
    <Card
      className={`
        relative overflow-hidden border
        ${colors.border} ${colors.bg}
        shadow-md hover:shadow-lg
        transition-all duration-300 ease-out
        hover:scale-[1.02]
        group
      `}
    >
      {/* Subtle background pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 opacity-20">
        <div className={`absolute inset-0 ${colors.accent} blur-3xl`} />
      </div>

      <CardContent className="relative p-3 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Team Logo */}
          <div className="flex-shrink-0">
            <div className={`
              relative w-14 h-14 sm:w-20 sm:h-20 rounded-2xl
              ${colors.accent}
              ring-2 ring-white/50 dark:ring-black/20
              shadow-lg flex items-center justify-center
              group-hover:scale-105 group-hover:rotate-3
              transition-all duration-300
              p-2 sm:p-3
            `}>
              <img
                src={getTeamLogo(team.team)}
                alt={team.team}
                className="w-full h-full object-contain drop-shadow-md"
                onError={(e) => {
                  // Fallback to icon if logo fails to load
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const icon = document.createElement('div');
                    icon.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
                    parent.appendChild(icon);
                  }
                }}
              />
            </div>
          </div>

          {/* Team Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[9px] sm:text-xs font-semibold tracking-wider uppercase text-muted-foreground/80">
                Top Team
              </p>
              <TrendingUp className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${colors.iconColor}`} />
            </div>

            <h3 className="text-sm sm:text-xl font-bold text-foreground truncate mb-1 sm:mb-2">
              {team.team}
            </h3>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <Target className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${colors.iconColor}`} />
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">
                  {team.picks} picks
                </span>
              </div>

              <div className="h-3 w-px bg-border/50" />

              <div className="flex items-center gap-1">
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {team.wins}-{team.losses}{team.pushes > 0 ? `-${team.pushes}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Win Rate Badge */}
          <div className="flex-shrink-0">
            <div className={`
              px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl
              ${colors.accent}
              ring-1 ring-white/30 dark:ring-black/20
              shadow-md
              group-hover:ring-2 group-hover:shadow-lg
              transition-all duration-300
            `}>
              <p className={`
                text-xl sm:text-3xl font-black ${colors.text}
                tracking-tight leading-none
              `}>
                {team.winRate}%
              </p>
              <p className="text-[7px] sm:text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/70 mt-0.5 text-center">
                Win
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
