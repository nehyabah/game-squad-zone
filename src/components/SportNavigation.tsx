import { useNavigate } from "react-router-dom";
import { useSport } from "@/hooks/use-sport";
import { cn } from "@/lib/utils";

export default function SportNavigation() {
  const { selectedSport } = useSport();
  const navigate = useNavigate();

  const handleSportChange = (sport: 'nfl' | 'six-nations') => {
    const path = sport === 'nfl' ? '/nfl' : '/six-nations';
    navigate(path);
  };

  return (
    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/30 backdrop-blur-sm">
      <button
        onClick={() => handleSportChange('nfl')}
        className={cn(
          "px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-300",
          selectedSport === 'nfl'
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        NFL
      </button>
      <button
        onClick={() => handleSportChange('six-nations')}
        className={cn(
          "px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-300",
          selectedSport === 'six-nations'
            ? "bg-green-600 text-white shadow-lg shadow-green-600/30"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        6 Nations
      </button>
    </div>
  );
}
