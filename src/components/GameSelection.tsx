import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles, Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { oddsApi, OddsGame } from "@/services/oddsApi";
import { usePicks } from "@/contexts/PicksContext";
import { picksApi } from "@/lib/api/picks";
import { getCurrentWeekIdSync, arePicksOpen } from "@/lib/utils/weekUtils";
import confetti from "canvas-confetti";

const GameSelection = () => {
  const { selectedPicks, setSelectedPicks } = usePicks();
  const { toast } = useToast();
  const [games, setGames] = useState<OddsGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weekInfo, setWeekInfo] = useState({
    weekNumber: 1,
    start: "",
    end: "",
  });
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const [existingPicks, setExistingPicks] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const maxGames = 3;

  useEffect(() => {
    loadGamesAndPicks();
  }, []);

  const loadGamesAndPicks = async () => {
    setIsLoading(true);
    try {
      // Get week info for display
      const weekData = oddsApi.getWeekDateRangeForDisplay();
      setWeekInfo(weekData);

      // Get games for current week only (Friday to Tuesday)
      const gameData = await oddsApi.getUpcomingGames(true);
      setGames(gameData);

      // Load existing picks for current week
      const weekId = getCurrentWeekIdSync();
      const picks = await picksApi.getWeekPicks(weekId);
      setExistingPicks(picks);

      // If picks exist, populate the selected picks and set edit mode
      if (picks && picks.picks) {
        const pickMap = new Map<string, "home" | "away">();
        picks.picks.forEach((pick) => {
          pickMap.set(pick.gameId, pick.choice);
        });
        setSelectedPicks(pickMap);
        setIsEditMode(true);
        console.log(
          "GameSelection: Loaded existing picks in edit mode:",
          picks
        );
      } else {
        setIsEditMode(false);
        console.log("GameSelection: No existing picks found");
      }
    } catch (error) {
      console.error("GameSelection: Error loading games and picks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const areGamesLocked = () => {
    // Check if we're outside the picks window (Friday 5 AM - Saturday 12 PM Dublin)
    if (!arePicksOpen()) {
      return true; // Picks are closed
    }

    // Also check if picks are already locked in database
    return existingPicks && existingPicks.status === "locked";
  };

  const handleSpreadPick = (gameId: string, team: "home" | "away") => {
    // Check if all games are locked for the week
    if (areGamesLocked()) {
      toast({
        title: "Picks locked",
        description:
          "Weekly picks lock Saturday at noon. Picks reopen on Thursday!",
        variant: "destructive",
      });
      return;
    }

    const newPicks = new Map(selectedPicks);

    if (newPicks.has(gameId)) {
      newPicks.delete(gameId);
    } else if (newPicks.size < maxGames) {
      newPicks.set(gameId, team);
    } else {
      toast({
        title: "Maximum games selected",
        description: "You can only select 3 games per week",
        variant: "destructive",
      });
      return;
    }

    setSelectedPicks(newPicks);
  };

  const submitPicks = async () => {
    if (selectedPicks.size < maxGames) {
      toast({
        title: "Select 3 games",
        description: "You must select exactly 3 games to submit your picks",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert selected picks to API format
      const picks = Array.from(selectedPicks.entries()).map(
        ([gameId, selection]) => ({
          gameId,
          selection,
        })
      );

      const weekId = getCurrentWeekIdSync();

      if (isEditMode && existingPicks) {
        // Delete existing picks first, then submit new ones
        await picksApi.deletePicks(weekId);
      }

      await picksApi.submitPicks({
        weekId,
        picks,
      });

      // Don't clear selected picks - keep them visible
      // setSelectedPicks(new Map());
      setIsEditMode(true);

      // Confetti celebration
      // First burst
      confetti({
        particleCount: 120,
        spread: 150,
        origin: { y: 0.6 },
        colors: [
          "#06d6a0",
          "#118ab2",
          "#073b4c",
          "#ffd166",
          "#f72585",
          "#7209b7",
          "#560bad",
          "#480ca8",
          "#3a0ca3",
          "#3f37c9",
          "#4cc9f0",
          "#f77f00",
          "#fcbf49",
          "#eae2b7",
          "#d62828",
          "#003049",
        ],
        scalar: 1.1,
        startVelocity: 30,
      });

      // Second burst with slight delay
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 150,
          origin: { y: 0.65 },
          colors: [
            "#06d6a0",
            "#118ab2",
            "#073b4c",
            "#ffd166",
            "#f72585",
            "#7209b7",
            "#560bad",
            "#480ca8",
            "#3a0ca3",
            "#3f37c9",
            "#4cc9f0",
            "#f77f00",
            "#fcbf49",
            "#eae2b7",
            "#d62828",
          ],
          scalar: 0.9,
          startVelocity: 25,
        });
      }, 200);
      const actionText = isEditMode ? "updated" : "submitted";
      toast({
        title: `🎉 Picks ${actionText}!`,
        description: `Your picks have been ${actionText} for this week. View them in My Picks!`,
        duration: 4000,
      });
      /* eslint-disable  @typescript-eslint/no-explicit-any */
    } catch (error: any) {
      console.error("Error submitting picks:", error);
      toast({
        title: "Error submitting picks",
        description:
          error.response?.data?.title ||
          "Failed to save your picks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 sm:space-y-4">
          <h2 className="text-xl sm:text-3xl font-display font-bold text-foreground">
            NFL Week {weekInfo.weekNumber} Games
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-xs sm:text-base px-3">
            Loading games and spreads...
          </p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-muted rounded" />
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                    <div className="h-4 w-4 bg-muted rounded" />
                    <div className="w-12 h-12 bg-muted rounded" />
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const gamesLocked = areGamesLocked();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {gamesLocked && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-destructive" />
          <div>
            <p className="font-semibold text-sm">Weekly picks are locked</p>
            <p className="text-xs text-muted-foreground">
              New picks open Friday at 5:00 AM EST. Picks lock Saturday at noon
              EST.
            </p>
          </div>
        </div>
      )}

      {!gamesLocked && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                Picks window:{" "}
              </span>
              <span className="text-blue-700 dark:text-blue-300">
                Friday 5:00 AM - Saturday 12:00 PM EST
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="text-center space-y-2 sm:space-y-4">
        <h2 className="text-xl sm:text-3xl font-display font-bold text-foreground">
          NFL Week {weekInfo.weekNumber} Games
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-xs sm:text-base px-3">
          {weekInfo.start && weekInfo.end
            ? `${weekInfo.start} - ${weekInfo.end} • `
            : ""}
          {gamesLocked
            ? "Picks are locked for this week"
            : isEditMode
            ? "Edit your 3 picks against the spread"
            : "Select 3 games against the spread"}
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap px-3">
          <Badge
            variant={selectedPicks.size === maxGames ? "default" : "secondary"}
            className="text-xs px-2 py-0.5"
          >
            {selectedPicks.size}/{maxGames} picked
          </Badge>
          <Badge
            variant={gamesLocked ? "destructive" : "outline"}
            className="text-xs px-2 py-0.5"
          >
            <Clock className="w-2 h-2 mr-1" />
            {gamesLocked ? (
              "LOCKED"
            ) : (
              <>
                <span className="hidden sm:inline">Locks: </span>Sat 12PM
              </>
            )}
          </Badge>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">
            No games available for Week {weekInfo.weekNumber} yet.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Games typically become available closer to game week.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {games.map((game) => {
            const selectedPick = selectedPicks.get(game.id);
            const spreadValue = Math.abs(game.spread);
            const hasSelectedPick = selectedPick !== undefined;
            const isLocked = areGamesLocked();

            return (
              <Card
                key={game.id}
                className={`group transition-all duration-300 ease-out border-border relative overflow-hidden ${
                  isLocked
                    ? "bg-muted/20 border-muted-foreground/20 opacity-60 cursor-not-allowed"
                    : hasSelectedPick
                    ? "bg-gradient-to-br from-primary/10 via-primary/15 to-primary/20 border-primary/40 shadow-md cursor-pointer transform hover:scale-[1.02]"
                    : "bg-muted/30 hover:border-primary/30 hover:shadow-elegant hover:bg-gradient-to-br hover:from-muted/40 hover:via-muted/50 hover:to-primary/20 cursor-pointer transform hover:scale-[1.02]"
                }`}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
                  e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
                }}
              >
                <CardContent className="p-3 sm:p-4 relative overflow-hidden">
                  {/* Weekly lock indicator - shown on all games when locked */}
                  {isLocked && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-destructive/20 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Lock className="w-3 h-3 text-destructive" />
                      {/* <span className="text-xs text-destructive font-medium">
                        LOCKED
                      </span> */}
                    </div>
                  )}
                  {/* Selected pick indicator - always show if user has made a pick */}
                  {hasSelectedPick && !isLocked && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm" />
                  )}
                  {/* Show selected picks even when locked */}
                  {hasSelectedPick && isLocked && (
                    <div className="absolute top-2 left-2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm" />
                  )}
                  {/* Mouse spotlight effect */}
                  <div
                    className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full blur-xl bg-primary/10 w-32 h-32 -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: "var(--mouse-x, 50%)",
                      top: "var(--mouse-y, 50%)",
                    }}
                  />
                  {/* Main content */}
                  <div className="relative flex flex-col items-center gap-2">
                    {/* Teams Layout - Logo Centered */}
                    <div className="flex items-center justify-center gap-4 sm:gap-8 w-full">
                      {/* Away Team */}
                      <div className="flex flex-col items-center gap-1">
                        <img
                          src={game.awayTeam.logo}
                          alt={`${game.awayTeam.name} logo`}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png";
                          }}
                        />
                        <div className="text-center">
                          <div className="font-medium text-foreground text-[10px] sm:text-xs">
                            {game.awayTeam.code}
                          </div>
                          <div className="text-muted-foreground text-[8px] sm:text-[10px] leading-tight">
                            {game.awayTeam.name}
                          </div>
                        </div>
                      </div>

                      {/* VS Separator */}
                      <div className="text-muted-foreground/60 text-xs font-medium">
                        @
                      </div>

                      {/* Home Team */}
                      <div className="flex flex-col items-center gap-1">
                        <img
                          src={game.homeTeam.logo}
                          alt={`${game.homeTeam.name} logo`}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png";
                          }}
                        />
                        <div className="text-center">
                          <div className="font-medium text-foreground text-[10px] sm:text-xs">
                            {game.homeTeam.code}
                          </div>
                          <div className="text-muted-foreground text-[8px] sm:text-[10px] leading-tight">
                            {game.homeTeam.name}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Game Time */}
                    <div className="text-center text-xs text-muted-foreground mb-2">
                      {game.time}
                    </div>

                    {/* Spread Selection Buttons */}
                    <div className="flex items-center gap-2 mt-1">
                      {game.spread < 0 ? (
                        <>
                          <button
                            onClick={() =>
                              !isLocked && handleSpreadPick(game.id, "away")
                            }
                            disabled={isLocked}
                            className={`px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base font-semibold transition-all duration-200 min-w-[50px] sm:min-w-[60px] ${
                              selectedPick === "away"
                                ? isLocked
                                  ? "bg-primary/60 text-primary-foreground/80 cursor-not-allowed"
                                  : "bg-primary text-primary-foreground shadow-sm hover:scale-105"
                                : isLocked
                                ? "bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:scale-105"
                            }`}
                          >
                            +{spreadValue}
                          </button>
                          <button
                            onClick={() =>
                              !isLocked && handleSpreadPick(game.id, "home")
                            }
                            disabled={isLocked}
                            className={`px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base font-semibold transition-all duration-200 min-w-[50px] sm:min-w-[60px] ${
                              isLocked
                                ? "bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                                : selectedPick === "home"
                                ? isLocked
                                  ? "bg-primary/60 text-primary-foreground/80 cursor-not-allowed"
                                  : "bg-primary text-primary-foreground shadow-sm hover:scale-105"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:scale-105"
                            }`}
                          >
                            -{spreadValue}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              !isLocked && handleSpreadPick(game.id, "away")
                            }
                            disabled={isLocked}
                            className={`px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base font-semibold transition-all duration-200 min-w-[50px] sm:min-w-[60px] ${
                              selectedPick === "away"
                                ? isLocked
                                  ? "bg-primary/60 text-primary-foreground/80 cursor-not-allowed"
                                  : "bg-primary text-primary-foreground shadow-sm hover:scale-105"
                                : isLocked
                                ? "bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:scale-105"
                            }`}
                          >
                            -{spreadValue}
                          </button>
                          <button
                            onClick={() =>
                              !isLocked && handleSpreadPick(game.id, "home")
                            }
                            disabled={isLocked}
                            className={`px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base font-semibold transition-all duration-200 min-w-[50px] sm:min-w-[60px] ${
                              isLocked
                                ? "bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                                : selectedPick === "home"
                                ? isLocked
                                  ? "bg-primary/60 text-primary-foreground/80 cursor-not-allowed"
                                  : "bg-primary text-primary-foreground shadow-sm hover:scale-105"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:scale-105"
                            }`}
                          >
                            +{spreadValue}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedPicks.size > 0 && games.length > 0 && !gamesLocked && (
        <div className="text-center">
          <Button
            variant="default"
            size="sm"
            onClick={submitPicks}
            disabled={isSubmitting || gamesLocked}
            className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 px-6 py-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
            <div className="relative flex items-center gap-1.5">
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : selectedPicks.size === maxGames ? (
                <Sparkles className="w-3.5 h-3.5" />
              ) : null}
              <span className="text-sm font-medium">
                {isSubmitting
                  ? isEditMode
                    ? "Updating..."
                    : "Submitting..."
                  : selectedPicks.size === maxGames
                  ? isEditMode
                    ? "Update Picks"
                    : "Submit Picks"
                  : `Select ${maxGames - selectedPicks.size} More`}
              </span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameSelection;
