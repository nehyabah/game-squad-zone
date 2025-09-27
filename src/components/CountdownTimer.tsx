import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();

      // Work in Eastern Time - create a proper ET Date object
      const nowET = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const currentDayET = nowET.getDay(); // 0 = Sunday, 6 = Saturday

      // Find next Saturday at noon Eastern Time
      let targetET = new Date(nowET);

      if (currentDayET === 6) {
        // Today is Saturday in ET
        const saturdayNoonET = new Date(nowET);
        saturdayNoonET.setHours(12, 0, 0, 0);

        if (nowET < saturdayNoonET) {
          // Before noon on Saturday - target today at noon
          targetET = saturdayNoonET;
        } else {
          // After noon on Saturday - target next Saturday at noon
          targetET.setDate(nowET.getDate() + 7);
          targetET.setHours(12, 0, 0, 0);
        }
      } else {
        // Not Saturday - find next Saturday
        const daysUntilSaturday = (6 - currentDayET + 7) % 7 || 7;
        targetET.setDate(nowET.getDate() + daysUntilSaturday);
        targetET.setHours(12, 0, 0, 0);
      }

      // Convert back to local time for accurate difference calculation
      // Get the offset difference between ET and local time
      const etOffset = nowET.getTimezoneOffset();
      const localOffset = now.getTimezoneOffset();
      const offsetMs = (localOffset - etOffset) * 60 * 1000;

      // Target time in local timezone
      const targetLocal = new Date(targetET.getTime() + offsetMs);
      const difference = targetLocal.getTime() - now.getTime();

      if (difference > 0) {
        setIsLocked(false);
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      } else {
        setIsLocked(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, []);

  if (isLocked) {
    return (
      <div className="text-center mb-8">
        <Card className="bg-destructive/10 border-destructive/20 max-w-md mx-auto">
          <CardContent className="p-4">
            <p className="text-destructive font-semibold">
              🔒 Picks are locked until next week
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="text-center mb-4 sm:mb-8">
      <p className="text-[10px] sm:text-sm text-muted-foreground mb-2 sm:mb-4">Picks lock in:</p>
      <div className="grid grid-cols-4 gap-1 sm:gap-4 max-w-xs sm:max-w-md mx-auto">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-1.5 sm:p-4 text-center">
            <div className="text-sm sm:text-2xl font-bold text-primary">{timeLeft.days}</div>
            <div className="text-[8px] sm:text-xs text-muted-foreground">Days</div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-1.5 sm:p-4 text-center">
            <div className="text-sm sm:text-2xl font-bold text-primary">{timeLeft.hours}</div>
            <div className="text-[8px] sm:text-xs text-muted-foreground">Hours</div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-1.5 sm:p-4 text-center">
            <div className="text-sm sm:text-2xl font-bold text-primary">{timeLeft.minutes}</div>
            <div className="text-[8px] sm:text-xs text-muted-foreground">Min</div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-1.5 sm:p-4 text-center">
            <div className="text-sm sm:text-2xl font-bold text-primary">{timeLeft.seconds}</div>
            <div className="text-[8px] sm:text-xs text-muted-foreground">Sec</div>
          </CardContent>
        </Card>
      </div>
      <p className="text-[8px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">Saturday 12:00 PM EST</p>
    </div>
  );
};

export default CountdownTimer;