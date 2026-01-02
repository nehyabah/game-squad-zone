const TIMEZONE = "Europe/Dublin";

/**
 * Get current hour in Dublin timezone
 */
export function getDublinHour(): number {
  const now = new Date();
  const dublinHour = new Intl.DateTimeFormat("en-IE", {
    timeZone: TIMEZONE,
    hour: "numeric",
    hour12: false,
  }).format(now);
  return parseInt(dublinHour);
}

/**
 * Get current day of week in Dublin timezone (0=Sunday, 5=Friday, 6=Saturday)
 */
export function getDublinDayOfWeek(): number {
  const now = new Date();
  const dublinDateString = now.toLocaleString("en-US", { timeZone: TIMEZONE });
  const dublinDate = new Date(dublinDateString);
  return dublinDate.getDay();
}

/**
 * Check if picks are currently open
 * Picks are open from Friday 5 AM until Saturday 12 PM (noon) - Dublin Time
 */
export function arePicksOpen(): boolean {
  const dayOfWeek = getDublinDayOfWeek();
  const hour = getDublinHour();

  // Friday at 5 AM or later
  if (dayOfWeek === 5 && hour >= 5) {
    return true;
  }

  // Saturday before noon
  if (dayOfWeek === 6 && hour < 12) {
    return true;
  }

  return false;
}

/**
 * Get the current week ID in format "YYYY-WN" (e.g., "2025-W4")
 * Advances to next week every Friday at 5 AM Dublin time
 */
export async function getCurrentWeekId(): Promise<string> {
  const weekNumber = await getCurrentNFLWeek();
  const year = 2025; // Temporarily hardcoded to 2025 for current season
  return `${year}-W${weekNumber}`;
}

/**
 * Get the current week ID synchronously
 * Advances to next week every Friday at 5 AM Dublin time
 */
export function getCurrentWeekIdSync(): string {
  const weekNumber = getCurrentNFLWeekSync();
  const year = 2025; // Temporarily hardcoded to 2025 for current season
  return `${year}-W${weekNumber}`;
}

/**
 * Get the season start date (first Friday 5 AM of the season in Dublin Time)
 */
function getSeasonStartDate(year: number): Date {
  // 2025 NFL season starts Friday, September 5, 2025 at 5:00 AM Dublin time (IST = UTC+1)
  if (year === 2025) {
    return new Date("2025-09-05T05:00:00+01:00");
  }

  // For other years, find first Friday in September at 5 AM Dublin time
  // Create date in UTC and adjust for Irish timezone
  const septemberFirst = new Date(Date.UTC(year, 8, 1, 4, 0, 0)); // 5 AM IST = 4 AM UTC in summer
  while (septemberFirst.getUTCDay() !== 5) {
    // Find first Friday (day 5)
    septemberFirst.setUTCDate(septemberFirst.getUTCDate() + 1);
  }

  return septemberFirst;
}

/**
 * Calculate week number based on Friday 5 AM boundaries (Dublin time)
 * Each week starts Friday at 5 AM and ends the following Friday at 5 AM
 */
function calculateWeekFromFridayMorning(
  currentDate: Date,
  seasonStart: Date
): number {
  // Get days since season start
  const daysSinceStart = Math.floor(
    (currentDate.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Base week from days
  let week = Math.floor(daysSinceStart / 7) + 1;

  // Check if we've crossed Friday 5 AM boundary for the current week
  const currentDayOfWeek = getDublinDayOfWeek();
  const currentHour = getDublinHour();

  // Calculate days into the current 7-day period
  const daysIntoWeek = daysSinceStart % 7;

  // If it's Friday (day 5) and we're at or past 5 AM (05:00)
  // AND we're in the 7th day of the week period (day 6 of 0-6)
  // Then advance to next week
  if (daysIntoWeek === 6 && currentDayOfWeek === 5 && currentHour >= 5) {
    week += 1;
  }

  return week;
}

/**
 * Calculate the current NFL week based on date and time (Dublin timezone)
 * Weeks advance every Friday at 5:00 AM Dublin time
 */
async function getCurrentNFLWeek(): Promise<number> {
  const now = new Date();
  const currentYear = 2025; // Temporarily hardcoded to 2025 for current season

  const seasonStart = getSeasonStartDate(currentYear);

  // If before season start, return week 1
  if (now < seasonStart) {
    return 1;
  }

  const weekNumber = calculateWeekFromFridayMorning(now, seasonStart);

  // NFL regular season has 18 weeks
  return Math.min(weekNumber, 18);
}

/**
 * Synchronous version of week calculation (Dublin timezone)
 */
function getCurrentNFLWeekSync(): number {
  const now = new Date();
  const currentYear = 2025; // Temporarily hardcoded to 2025 for current season

  const seasonStart = getSeasonStartDate(currentYear);

  // If before season start, return week 1
  if (now < seasonStart) {
    return 1;
  }

  const weekNumber = calculateWeekFromFridayMorning(now, seasonStart);

  // NFL regular season has 18 weeks
  return Math.min(weekNumber, 18);
}

/**
 * Get week ID from a specific date (Dublin timezone)
 * Maps any date to the appropriate NFL week for that year
 */
export function getWeekIdFromDate(date: Date): string {
  // For 2025 season: Hardcode to handle games in Jan 2026 as part of 2025 season
  const currentSeasonYear = 2025;
  const currentSeasonStart = getSeasonStartDate(currentSeasonYear);
  const nextSeasonStart = getSeasonStartDate(currentSeasonYear + 1);

  // If date falls within current season (Sept 2025 - Aug 2026), use current season year
  if (date >= currentSeasonStart && date < nextSeasonStart) {
    const weekNumber = calculateWeekFromFridayMorning(date, currentSeasonStart);
    const week = Math.min(weekNumber, 18);
    return `${currentSeasonYear}-W${week}`;
  }

  // Otherwise, use the date's year and calculate normally
  const year = date.getFullYear();
  const seasonStart = getSeasonStartDate(year);

  // If before season start, return week 1
  if (date < seasonStart) {
    return `${year}-W1`;
  }

  // Calculate week number
  const weekNumber = calculateWeekFromFridayMorning(date, seasonStart);

  // NFL regular season has 18 weeks
  const week = Math.min(weekNumber, 18);

  return `${year}-W${week}`;
}

/**
 * Get the Friday 5 AM date when a specific week opens (Dublin time)
 */
export function getWeekOpenDate(weekId: string): Date {
  const [yearStr, weekStr] = weekId.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);

  const seasonStart = getSeasonStartDate(year);

  // Add (week - 1) weeks to season start
  const weekOpenDate = new Date(seasonStart);
  weekOpenDate.setDate(weekOpenDate.getDate() + (week - 1) * 7);

  return weekOpenDate;
}

/**
 * Get the Saturday noon date when picks lock for a specific week (Dublin time)
 */
export function getWeekLockDate(weekId: string): Date {
  const openDate = getWeekOpenDate(weekId);

  // Add 1 day and 7 hours to Friday 5 AM = Saturday 12 PM (noon)
  const lockDate = new Date(openDate);
  lockDate.setDate(lockDate.getDate() + 1);
  lockDate.setHours(lockDate.getHours() + 7); // 5 AM + 7 hours = 12 PM

  return lockDate;
}

/**
 * Check if we're in the results period (Wednesday-Thursday before next week opens)
 */
export function isResultsPeriod(): boolean {
  const dayOfWeek = getDublinDayOfWeek();
  const hour = getDublinHour();

  // Wednesday (3) or Thursday (4)
  // Or Friday before 5 AM
  return dayOfWeek === 3 || dayOfWeek === 4 || (dayOfWeek === 5 && hour < 5);
}

/**
 * Check if all games in a week are completed
 */
async function checkAllWeekGamesCompleted(weekId: string): Promise<boolean> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/api/games?weekId=${weekId}`);

    if (!response.ok) {
      return false;
    }

    const games = await response.json();

    // If no games exist for the week, consider it not completed
    if (!games || games.length === 0) {
      return false;
    }

    // Check if all games are completed

    return games.every((game: any) => game.completed === true);
  } catch (error) {
    console.warn("Error checking game completion:", error);
    return false;
  }
}

/**
 * Format a week ID for display (e.g., "2025-W1" -> "Week 1")
 */
export function formatWeekForDisplay(weekId: string): string {
  const match = weekId.match(/W(\d+)/);
  return match ? `Week ${match[1]}` : weekId;
}
