import { useState } from "react";
import { PersonalInsights } from "./PersonalInsights";
import { SquadOverview } from "./SquadOverview";
import { MemberComparison } from "./MemberComparison";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Users, User, BarChart3 } from "lucide-react";

interface StatisticsTabProps {
  squadId: string;
  userId: string;
}

export const StatisticsTab = ({ squadId, userId }: StatisticsTabProps) => {
  const [expandedSections, setExpandedSections] = useState({
    squad: true,
    comparison: true,
    personal: true
  });

  const toggleSection = (section: 'squad' | 'comparison' | 'personal') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="space-y-6 sm:space-y-10 pb-6 sm:pb-10">
      {/* Squad Overview Section */}
      <section className="group">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm ring-1 ring-blue-500/20">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
                Squad Statistics
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Team-wide performance and trends
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection('squad')}
            className="sm:hidden rounded-full"
          >
            {expandedSections.squad ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {expandedSections.squad && (
          <div className="animate-in fade-in-50 duration-300">
            <SquadOverview squadId={squadId} />
          </div>
        )}
      </section>

      {/* Separator with gradient */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/30" />
        </div>
        <div className="relative flex justify-center">
          <div className="px-4 bg-background">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-30" />
          </div>
        </div>
      </div>

      {/* Member Comparison Section */}
      <section className="group">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm ring-1 ring-emerald-500/20">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
                Member Comparison
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Compare stats between squad members
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection('comparison')}
            className="sm:hidden rounded-full"
          >
            {expandedSections.comparison ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {expandedSections.comparison && (
          <div className="animate-in fade-in-50 duration-300">
            <MemberComparison squadId={squadId} />
          </div>
        )}
      </section>

      {/* Separator with gradient */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/30" />
        </div>
        <div className="relative flex justify-center">
          <div className="px-4 bg-background">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 opacity-30" />
          </div>
        </div>
      </div>

      {/* Personal Insights Section */}
      <section className="group">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 backdrop-blur-sm ring-1 ring-violet-500/20">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
                Personal Insights
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Your individual stats and patterns
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection('personal')}
            className="sm:hidden rounded-full"
          >
            {expandedSections.personal ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {expandedSections.personal && (
          <div className="animate-in fade-in-50 duration-300">
            <PersonalInsights userId={userId} squadId={squadId} />
          </div>
        )}
      </section>
    </div>
  );
};
