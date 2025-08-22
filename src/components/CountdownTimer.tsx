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
      // Set target to next Saturday at 12:00 PM EST
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
      const daysUntilSaturday = currentDay === 6 ? 7 : (6 - currentDay);
      
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + daysUntilSaturday);
      targetDate.setHours(12, 0, 0, 0); // 12:00 PM
      
      // If it's Saturday and past 12 PM, target next Saturday
      if (currentDay === 6 && now.getHours() >= 12) {
        targetDate.setDate(targetDate.getDate() + 7);
      }

      const difference = targetDate.getTime() - now.getTime();

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
    <div className="text-center mb-8">
      <p className="text-sm text-muted-foreground mb-4">Picks lock in:</p>
      <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{timeLeft.days}</div>
            <div className="text-xs text-muted-foreground">Days</div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{timeLeft.hours}</div>
            <div className="text-xs text-muted-foreground">Hours</div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{timeLeft.minutes}</div>
            <div className="text-xs text-muted-foreground">Minutes</div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{timeLeft.seconds}</div>
            <div className="text-xs text-muted-foreground">Seconds</div>
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Saturday 12:00 PM EST</p>
    </div>
  );
};

export default CountdownTimer;