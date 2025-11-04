import { Card, CardContent } from "@/components/ui/card";
import { Crown, TrendingUp } from "lucide-react";

interface SquadLeaderCardProps {
  leader: {
    name: string;
    winPercentage: number;
  } | null;
}

export const SquadLeaderCard = ({ leader }: SquadLeaderCardProps) => {
  if (!leader) {
    return (
      <Card className="relative overflow-hidden border-dashed border-2 border-muted-foreground/20">
        <CardContent className="p-2.5 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-muted/30 rounded-lg">
              <Crown className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground/40" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] sm:text-sm text-muted-foreground font-medium mb-0.5">
                Squad Leader
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

  // Determine performance tier for subtle color variations
  const getTierColors = (percentage: number) => {
    if (percentage >= 70) {
      return {
        border: "border-amber-200/60 dark:border-amber-500/40",
        bg: "bg-gradient-to-br from-amber-50/80 via-yellow-50/60 to-orange-50/40 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/10",
        crownBg: "bg-gradient-to-br from-amber-400/20 to-yellow-400/20 dark:from-amber-500/30 dark:to-yellow-500/30",
        crownColor: "text-amber-600 dark:text-amber-400",
        percentageColor: "text-amber-700 dark:text-amber-300",
        glowColor: "shadow-amber-200/50 dark:shadow-amber-500/20",
        shimmer: "from-transparent via-amber-100/40 to-transparent dark:via-amber-400/10"
      };
    } else if (percentage >= 55) {
      return {
        border: "border-blue-200/60 dark:border-blue-500/40",
        bg: "bg-gradient-to-br from-blue-50/80 via-sky-50/60 to-cyan-50/40 dark:from-blue-950/30 dark:via-sky-950/20 dark:to-cyan-950/10",
        crownBg: "bg-gradient-to-br from-blue-400/20 to-sky-400/20 dark:from-blue-500/30 dark:to-sky-500/30",
        crownColor: "text-blue-600 dark:text-blue-400",
        percentageColor: "text-blue-700 dark:text-blue-300",
        glowColor: "shadow-blue-200/50 dark:shadow-blue-500/20",
        shimmer: "from-transparent via-blue-100/40 to-transparent dark:via-blue-400/10"
      };
    } else {
      return {
        border: "border-slate-200/60 dark:border-slate-500/40",
        bg: "bg-gradient-to-br from-slate-50/80 via-gray-50/60 to-zinc-50/40 dark:from-slate-950/30 dark:via-gray-950/20 dark:to-zinc-950/10",
        crownBg: "bg-gradient-to-br from-slate-400/20 to-gray-400/20 dark:from-slate-500/30 dark:to-gray-500/30",
        crownColor: "text-slate-600 dark:text-slate-400",
        percentageColor: "text-slate-700 dark:text-slate-300",
        glowColor: "shadow-slate-200/50 dark:shadow-slate-500/20",
        shimmer: "from-transparent via-slate-100/40 to-transparent dark:via-slate-400/10"
      };
    }
  };

  const colors = getTierColors(leader.winPercentage);

  return (
    <Card
      className={`
        relative overflow-hidden border-2
        ${colors.border} ${colors.bg} ${colors.glowColor}
        shadow-lg hover:shadow-xl
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:-translate-y-0.5
        group
      `}
    >
      {/* Animated shimmer effect */}
      <div
        className={`
          absolute inset-0 -translate-x-full
          group-hover:translate-x-full
          transition-transform duration-[1500ms] ease-out
          bg-gradient-to-r ${colors.shimmer}
          pointer-events-none
        `}
      />

      {/* Subtle corner accent */}
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 opacity-30">
        <div className={`absolute inset-0 ${colors.crownBg} blur-2xl`} />
      </div>

      <CardContent className="relative p-3 sm:p-6">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Crown Icon with Badge */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className={`
              relative p-2 sm:p-3 ${colors.crownBg} rounded-xl
              ring-2 ring-white/50 dark:ring-black/20
              shadow-lg
              group-hover:scale-110 group-hover:rotate-6
              transition-all duration-500
            `}>
              <Crown className={`w-5 h-5 sm:w-7 sm:h-7 ${colors.crownColor} drop-shadow-sm`} />

              {/* Sparkle effect */}
              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3">
                <div className={`
                  absolute inset-0 ${colors.crownBg} rounded-full
                  animate-ping opacity-75
                `} />
                <div className={`absolute inset-0 ${colors.crownBg} rounded-full`} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                <p className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-muted-foreground/80">
                  Squad Leader
                </p>
                <div className={`
                  h-1 flex-1 rounded-full ${colors.crownBg} max-w-8 sm:max-w-12
                  group-hover:max-w-16 sm:group-hover:max-w-24 transition-all duration-500
                `} />
              </div>

              <h3 className="text-base sm:text-2xl font-bold text-foreground truncate mb-1 sm:mb-1.5">
                {leader.name}
              </h3>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <TrendingUp className={`w-3 h-3 sm:w-4 sm:h-4 ${colors.crownColor}`} />
                <p className="text-[9px] sm:text-xs text-muted-foreground font-medium">
                  Leading the pack
                </p>
              </div>
            </div>
          </div>

          {/* Win Percentage - Large and Prominent */}
          <div className="text-right flex-shrink-0">
            <div className={`
              px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl
              ${colors.crownBg}
              ring-1 ring-white/30 dark:ring-black/20
              shadow-md
              group-hover:ring-2 group-hover:shadow-lg
              transition-all duration-300
            `}>
              <p className={`
                text-2xl sm:text-4xl font-black ${colors.percentageColor}
                tracking-tight leading-none
              `}>
                {leader.winPercentage}%
              </p>
              <p className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mt-0.5 sm:mt-1">
                Win Rate
              </p>
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="mt-2 sm:mt-3 h-1 w-full rounded-full bg-gradient-to-r from-transparent via-current to-transparent opacity-20"
             style={{ color: colors.crownColor.includes('amber') ? '#f59e0b' : colors.crownColor.includes('blue') ? '#3b82f6' : '#64748b' }}
        />
      </CardContent>
    </Card>
  );
};
