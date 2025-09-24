import { PrismaClient } from '@prisma/client';
import { getCurrentWeekIdSync } from '../utils/weekUtils';

/**
 * Pick Locking Service - Handles automatic locking of picks every Saturday at 12 PM
 */
export class PickLockingService {
  private lockingInterval: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Start the automatic pick locking scheduler
   * Runs every hour and locks picks on Saturday at 12 PM
   */
  startPickLockingScheduler(): NodeJS.Timeout {
    console.log('⏰ Starting pick locking scheduler (every 1 hour)');

    this.lockingInterval = setInterval(async () => {
      await this.checkAndLockPicks();
    }, 60 * 60 * 1000); // Every hour

    // Also run immediately on startup
    setTimeout(() => {
      this.checkAndLockPicks();
    }, 5000); // 5 second delay after startup

    return this.lockingInterval;
  }

  /**
   * Check if we need to lock picks and do it if it's Saturday 12 PM
   */
  private async checkAndLockPicks(): Promise<void> {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      const hour = now.getHours();

      console.log(`🔒 Pick locking check: ${now.toISOString()} (Day: ${dayOfWeek}, Hour: ${hour})`);

      // Only lock on Saturday (day 6) at 12 PM (hour 12)
      if (dayOfWeek === 6 && hour === 12) {
        console.log('📅 Saturday 12 PM detected - locking all picks for current week');
        await this.lockCurrentWeekPicks();
      } else {
        console.log('⏭️  Not Saturday 12 PM, skipping pick locking');
      }

    } catch (error) {
      console.error('❌ Error in pick locking scheduler:', error);
    }
  }

  /**
   * Lock all pick sets for the current week
   */
  private async lockCurrentWeekPicks(): Promise<void> {
    try {
      const currentWeekId = getCurrentWeekIdSync();
      console.log(`🔒 Locking all picks for ${currentWeekId}`);

      // Update all 'submitted' pick sets to 'locked' for current week
      const result = await this.prisma.pickSet.updateMany({
        where: {
          weekId: currentWeekId,
          status: 'submitted'
        },
        data: {
          status: 'locked',
          lockedAtUtc: new Date()
        }
      });

      console.log(`✅ Locked ${result.count} pick sets for ${currentWeekId}`);

      // Log details for monitoring
      const lockedSets = await this.prisma.pickSet.findMany({
        where: {
          weekId: currentWeekId,
          status: 'locked'
        },
        include: {
          user: {
            select: { username: true, email: true }
          }
        }
      });

      console.log(`📊 Total locked pick sets for ${currentWeekId}: ${lockedSets.length}`);
      lockedSets.forEach(pickSet => {
        console.log(`   - ${pickSet.user.username || pickSet.user.email}: locked at ${pickSet.lockedAtUtc}`);
      });

    } catch (error) {
      console.error('❌ Error locking picks for current week:', error);
    }
  }

  /**
   * Check if current week picks are locked (Saturday 12 PM has passed)
   */
  async arePicksLockedForCurrentWeek(): Promise<boolean> {
    const now = new Date();
    const currentWeekId = getCurrentWeekIdSync();

    // Calculate this week's Saturday 12 PM
    const saturdayNoon = this.getSaturdayNoonForWeek(currentWeekId);

    return now >= saturdayNoon;
  }

  /**
   * Get the Saturday 12 PM deadline for a given week
   */
  getSaturdayNoonForWeek(weekId: string): Date {
    // Extract week number from weekId (e.g., "2025-W4" -> 4)
    const weekMatch = weekId.match(/(\d{4})-W(\d+)/);
    if (!weekMatch) {
      throw new Error(`Invalid week ID format: ${weekId}`);
    }

    const year = parseInt(weekMatch[1]);
    const weekNumber = parseInt(weekMatch[2]);

    // NFL 2025 season starts Friday, September 5, 2025
    const seasonStart = new Date('2025-09-05T00:00:00Z');

    // Calculate the Friday start of this week
    const daysFromSeasonStart = (weekNumber - 1) * 7;
    const weekStartFriday = new Date(seasonStart);
    weekStartFriday.setDate(seasonStart.getDate() + daysFromSeasonStart);

    // Saturday is the day after Friday
    const saturday = new Date(weekStartFriday);
    saturday.setDate(weekStartFriday.getDate() + 1);

    // Set to 12 PM (noon) on Saturday
    saturday.setHours(12, 0, 0, 0);

    return saturday;
  }

  /**
   * Stop the pick locking scheduler
   */
  stopPickLockingScheduler(): void {
    if (this.lockingInterval) {
      clearInterval(this.lockingInterval);
      this.lockingInterval = null;
      console.log('⏹️  Pick locking scheduler stopped');
    }
  }

  /**
   * Manual trigger for testing - lock picks immediately
   */
  async lockPicksNow(): Promise<void> {
    console.log('🔒 Manual pick locking triggered');
    await this.lockCurrentWeekPicks();
  }
}