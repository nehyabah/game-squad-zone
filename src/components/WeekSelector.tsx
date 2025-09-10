import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentWeekIdSync } from "@/lib/utils/weekUtils";

interface WeekInfo {
  weekId: string;
  weekNumber: number;
  isCurrent: boolean;
  hasPicks: boolean;
  record?: {
    wins: number;
    losses: number;
    pushes: number;
  };
}

interface WeekSelectorProps {
  selectedWeek: string;
  onWeekChange: (weekId: string) => void;
  availableWeeks?: WeekInfo[];
  compact?: boolean;
}

const WeekSelector = ({ 
  selectedWeek, 
  onWeekChange, 
  availableWeeks = [], 
  compact = false 
}: WeekSelectorProps) => {
  const currentWeekId = getCurrentWeekIdSync();

  const generateWeeks = useMemo((): WeekInfo[] => {
    const weeks: WeekInfo[] = [];
    const currentYear = new Date().getFullYear();
    
    // Generate weeks 1-18 for the current season
    for (let i = 1; i <= 18; i++) {
      const weekId = `${currentYear}-W${i}`;
      weeks.push({
        weekId,
        weekNumber: i,
        isCurrent: weekId === currentWeekId,
        hasPicks: false, // Will be updated when we have data
      });
    }
    
    return weeks;
  }, [currentWeekId]);

  const weeks = useMemo(() => {
    return availableWeeks.length > 0 ? availableWeeks : generateWeeks;
  }, [availableWeeks, generateWeeks]);

  const selectedWeekInfo = weeks.find(w => w.weekId === selectedWeek);
  const selectedIndex = weeks.findIndex(w => w.weekId === selectedWeek);
  
  const goToPreviousWeek = () => {
    if (selectedIndex > 0) {
      onWeekChange(weeks[selectedIndex - 1].weekId);
    }
  };

  const goToNextWeek = () => {
    if (selectedIndex < weeks.length - 1) {
      onWeekChange(weeks[selectedIndex + 1].weekId);
    }
  };

  const goToCurrentWeek = () => {
    onWeekChange(currentWeekId);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousWeek}
          disabled={selectedIndex <= 0}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2 min-w-[120px] justify-center">
          <Badge 
            variant="outline"
            className="text-sm font-medium border-slate-200/60 bg-slate-50/60 text-slate-700"
          >
            Week {selectedWeekInfo?.weekNumber || 1}
          </Badge>
          {selectedWeekInfo?.record && (
            <span className="text-xs text-muted-foreground">
              {selectedWeekInfo.record.wins}W-{selectedWeekInfo.record.losses}L-{selectedWeekInfo.record.pushes}D
            </span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextWeek}
          disabled={selectedIndex >= weeks.length - 1}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousWeek}
            disabled={selectedIndex <= 0}
            className="h-9"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="text-center">
            <div className="font-semibold text-lg">
              Week {selectedWeekInfo?.weekNumber || 1}
            </div>
            {selectedWeekInfo?.record && (
              <div className="text-sm text-muted-foreground">
                {selectedWeekInfo.record.wins}W-{selectedWeekInfo.record.losses}L-{selectedWeekInfo.record.pushes}D
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextWeek}
            disabled={selectedIndex >= weeks.length - 1}
            className="h-9"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedWeekInfo?.isCurrent && (
            <Badge variant="outline" className="text-sm border-slate-200/60 bg-slate-50/60 text-slate-700">
              Current Week
            </Badge>
          )}
        </div>
      </div>

      {/* Week Grid for Quick Access */}
      <div className="bg-muted/30 p-3 rounded-lg">
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto scrollbar-hide">
          {weeks.slice(0, 18).map((week) => (
            <Button
              key={week.weekId}
              variant={week.weekId === selectedWeek ? "outline" : "ghost"}
              size="sm"
              onClick={() => onWeekChange(week.weekId)}
              className={`h-8 min-w-[36px] text-xs ${
                week.isCurrent ? 'ring-2 ring-slate-300' : ''
              } ${week.hasPicks ? 'font-semibold' : ''} ${
                week.weekId === selectedWeek ? 'border-slate-200/60 bg-slate-50/60 text-slate-700' : ''
              }`}
            >
              {week.weekNumber}
              {week.record && (
                <span className="ml-1 text-[10px] opacity-75">
                  {week.record.wins}-{week.record.losses}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekSelector;