import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TIMEZONE = "Europe/Dublin";

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();

      // Work in Dublin Time - create a proper Dublin Date object
      const nowDublin = new Date(
        now.toLocaleString("en-US", { timeZone: TIMEZONE })
      );
      const currentDayDublin = nowDublin.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday

      // Find next Saturday at noon Dublin Time
      let targetDublin = new Date(nowDublin);

      if (currentDayDublin === 6) {
        // Today is Saturday in Dublin
        const saturdayNoonDublin = new Date(nowDublin);
        saturdayNoonDublin.setHours(12, 0, 0, 0);

        if (nowDublin < saturdayNoonDublin) {
          // Before noon on Saturday - target today at noon
          targetDublin = saturdayNoonDublin;
        } else {
          // After noon on Saturday - target next Saturday at noon
          targetDublin.setDate(nowDublin.getDate() + 7);
          targetDublin.setHours(12, 0, 0, 0);
        }
      } else {
        // Not Saturday - find next Saturday
        const daysUntilSaturday = (6 - currentDayDublin + 7) % 7 || 7;
        targetDublin.setDate(nowDublin.getDate() + daysUntilSaturday);
        targetDublin.setHours(12, 0, 0, 0);
      }

      // Convert back to local time for accurate difference calculation
      // Get the offset difference between Dublin and local time
      const dublinOffset = nowDublin.getTimezoneOffset();
      const localOffset = now.getTimezoneOffset();
      const offsetMs = (localOffset - dublinOffset) * 60 * 1000;

      // Target time in local timezone
      const targetLocal = new Date(targetDublin.getTime() + offsetMs);
      const difference = targetLocal.getTime() - now.getTime();

      if (difference > 0) {
        setIsLocked(false);
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
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
            <p className="text-xs text-muted-foreground mt-2">
              New picks open Friday at 5:00 AM Irish Time
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="text-center mb-4 sm:mb-8">
      <p className="text-[10px] sm:text-sm text-muted-foreground mb-1">
        Picks open Friday 5:00 AM Irish Time
      </p>
      <p className="text-[10px] sm:text-sm text-muted-foreground mb-2 sm:mb-4 font-semibold">
        Picks lock in:
      </p>
      <div className="grid grid-cols-4 gap-1 sm:gap-4 max-w-xs sm:max-w-md mx-auto">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-1.5 sm:p-4 text-center">
            <div className="text-sm sm:text-2xl font-bold text-primary">
              {timeLeft.days}
            </div>
            <div className="text-[8px] sm:text-xs text-muted-foreground">
              Days
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-1.5 sm:p-4 text-center">
            <div className="text-sm sm:text-2xl font-bold text-primary">
              {timeLeft.hours}
            </div>
            <div className="text-[8px] sm:text-xs text-muted-foreground">
              Hours
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-1.5 sm:p-4 text-center">
            <div className="text-sm sm:text-2xl font-bold text-primary">
              {timeLeft.minutes}
            </div>
            <div className="text-[8px] sm:text-xs text-muted-foreground">
              Min
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-1.5 sm:p-4 text-center">
            <div className="text-sm sm:text-2xl font-bold text-primary">
              {timeLeft.seconds}
            </div>
            <div className="text-[8px] sm:text-xs text-muted-foreground">
              Sec
            </div>
          </CardContent>
        </Card>
      </div>
      <p className="text-[8px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
        Saturday 12:00 PM Irish Time
      </p>
    </div>
  );
};

export default CountdownTimer;
