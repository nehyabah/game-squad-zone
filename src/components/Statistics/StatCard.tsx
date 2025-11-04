import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  animate?: boolean;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  className = "",
  animate = true
}: StatCardProps) => {
  // Extract numeric value for animation
  const isNumeric = typeof value === 'number';
  const numericValue = isNumeric ? value : parseInt(String(value).match(/\d+/)?.[0] || '0');
  const animatedValue = useCountUp(numericValue, 1000);

  // For display, use animated value if it's a pure number, otherwise use original
  const displayValue = animate && isNumeric ? animatedValue : value;

  return (
    <Card className={`${className}`}>
      <CardContent className="p-2.5 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[10px] sm:text-sm text-muted-foreground font-medium mb-0.5 sm:mb-1">
              {title}
            </p>
            <p className="text-lg sm:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">
              {displayValue}
            </p>
            {subtitle && (
              <p className="text-[9px] sm:text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className={`text-[9px] sm:text-xs font-medium mt-0.5 sm:mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          {Icon && (
            <div className="ml-1 sm:ml-2 p-1 sm:p-2 bg-primary/10 rounded-lg">
              <Icon className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
