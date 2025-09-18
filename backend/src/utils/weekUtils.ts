/**
 * Get the current week ID in format "YYYY-WN" (e.g., "2025-W2")
 * Advances to next week when all current week games are completed
 */
export async function getCurrentWeekId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const currentWeek = await getCurrentNFLWeek();
  return `${currentYear}-W${currentWeek}`;
}

/**
 * Get the current week ID synchronously (fallback for components that can't use async)
 * Uses date-only calculation without checking game completion
 */
export function getCurrentWeekIdSync(): string {
  const currentYear = new Date().getFullYear();
  const currentWeek = getCurrentNFLWeekSync();
  return `${currentYear}-W${currentWeek}`;
}

/**
 * Calculate the current NFL week based on date
 * NFL season starts first Thursday in September each year
 * Advances to next week when all current week games are completed
 */
async function getCurrentNFLWeek(): Promise<number> {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // NFL season typically starts first Thursday in September
  const seasonStart = new Date(currentYear, 8, 1); // September 1st
  while (seasonStart.getDay() !== 4) { // Find first Thursday (day 4)
    seasonStart.setDate(seasonStart.getDate() + 1);
  }
  
  // If before season start, return week 1
  if (now < seasonStart) {
    return 1;
  }
  
  // Calculate days since season start
  const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // Each week is 7 days, starting from week 1
  const baseWeek = Math.floor(daysSinceStart / 7) + 1;
  
  // Check if all games in the current base week are completed
  // If so, advance to next week for better UX
  try {
    const currentWeekId = `${currentYear}-W${baseWeek}`;
    const allGamesCompleted = await checkAllWeekGamesCompleted(currentWeekId);
    
    if (allGamesCompleted && baseWeek < 18) {
      return baseWeek + 1;
    }
  } catch (error) {
    // If we can't check games, fall back to date-based calculation
    console.warn('Could not check game completion status, using date-based week');
  }
  
  // NFL regular season has 18 weeks
  return Math.min(baseWeek, 18);
}

/**
 * Synchronous version of week calculation (date-based only)
 */
function getCurrentNFLWeekSync(): number {
  // TODO: PRODUCTION FIX REQUIRED - Remove hardcoded week and restore dynamic calculation
  // For now, return Week 3 as requested
  return 3;
  
  /* Original logic for reference:
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // NFL season typically starts first Thursday in September
  const seasonStart = new Date(currentYear, 8, 1); // September 1st
  while (seasonStart.getDay() !== 4) { // Find first Thursday (day 4)
    seasonStart.setDate(seasonStart.getDate() + 1);
  }
  
  // If before season start, return week 1
  if (now < seasonStart) {
    return 1;
  }
  
  // Calculate days since season start
  const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // Each week is 7 days, starting from week 1
  const baseWeek = Math.floor(daysSinceStart / 7) + 1;
  
  // NFL regular season has 18 weeks
  return Math.min(baseWeek, 18);
  */
}

/**
 * Check if all games in a week are completed (backend version)
 */
async function checkAllWeekGamesCompleted(weekId: string): Promise<boolean> {
  try {
    // Access Prisma directly on the backend
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const games = await prisma.game.findMany({
      where: { weekId },
      select: { completed: true }
    });
    
    await prisma.$disconnect();
    
    // If no games exist for the week, consider it not completed
    if (!games || games.length === 0) {
      return false;
    }
    
    // Check if all games are completed
    return games.every(game => game.completed === true);
  } catch (error) {
    console.warn('Error checking game completion:', error);
    return false;
  }
}

/**
 * Get week ID from a specific date
 * Maps any date to the appropriate NFL week for that year
 */
export function getWeekIdFromDate(date: Date): string {
  const year = date.getFullYear();
  
  // Find first Thursday of September for that year
  const seasonStart = new Date(year, 8, 1); // September 1st
  while (seasonStart.getDay() !== 4) { // Find first Thursday (day 4)
    seasonStart.setDate(seasonStart.getDate() + 1);
  }
  
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