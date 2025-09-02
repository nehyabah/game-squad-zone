/**
 * Get the current week ID in format "YYYY-WN" (e.g., "2025-W1")
 */
export function getCurrentWeekId(): string {
  const currentYear = new Date().getFullYear();
  const currentWeek = getCurrentNFLWeek();
  return `${currentYear}-W${currentWeek}`;
}

/**
 * Calculate the current NFL week based on date
 * NFL weeks typically run Thursday to Wednesday
 * NFL season 2025 starts around September 4, 2025
 */
function getCurrentNFLWeek(): number {
  const now = new Date();
  // NFL 2025 season starts approximately September 4, 2025 (Thursday)
  const seasonStart = new Date('2025-09-04');
  
  // If before season start, return week 1
  if (now < seasonStart) {
    return 1;
  }
  
  // Calculate days since season start
  const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // Each week is 7 days, starting from week 1
  const week = Math.floor(daysSinceStart / 7) + 1;
  
  // NFL regular season has 18 weeks
  return Math.min(week, 18);
}

/**
 * Get week ID from a specific date
 */
export function getWeekIdFromDate(date: Date): string {
  const year = date.getFullYear();
  const seasonStart = new Date(`${year}-09-04`); // Approximate NFL season start
  
  // If before season start, return week 1
  if (date < seasonStart) {
    return `${year}-W1`;
  }
  
  // Calculate days since season start
  const daysSinceStart = Math.floor((date.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // Each week is 7 days, starting from week 1
  const week = Math.floor(daysSinceStart / 7) + 1;
  
  // NFL regular season has 18 weeks
  const weekNumber = Math.min(week, 18);
  
  return `${year}-W${weekNumber}`;
}