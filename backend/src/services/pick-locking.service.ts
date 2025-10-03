import { PrismaClient } from "@prisma/client";
import {
  getCurrentWeekIdSync,
  getDublinHour,
  getDublinDayOfWeek,
  arePicksOpen,
} from "../utils/weekUtils";
import { PushNotificationService } from "./push-notification.service";

/**
 * Pick Locking Service - Handles automatic locking of picks every Saturday at 12 PM Dublin time
 * and sends notifications when picks open on Friday at 5 AM Dublin time
 */
export class PickLockingService {
  private lockingInterval: NodeJS.Timeout | null = null;
  private notificationService: PushNotificationService;

  constructor(private readonly prisma: PrismaClient) {
    this.notificationService = new PushNotificationService(prisma);
  }

  /**
   * Start the automatic pick locking scheduler
   * Runs every hour and locks picks on Saturday at 12 PM Dublin time
   * Also sends picks open notifications on Friday at 5 AM Dublin time
   */
  startPickLockingScheduler(): NodeJS.Timeout {
    console.log(
      "⏰ Starting pick locking scheduler (every 1 hour) - Dublin timezone"
    );

    this.lockingInterval = setInterval(async () => {
      await this.checkAndLockPicks();
      await this.checkAndSendPicksOpenNotification();
    }, 60 * 60 * 1000); // Every hour

    // Also run immediately on startup
    setTimeout(() => {
      this.checkAndLockPicks();
      this.checkAndSendPicksOpenNotification();
    }, 5000); // 5 second delay after startup

    return this.lockingInterval;
  }

  /**
   * Check if we need to lock picks and do it if it's Saturday 12 PM Dublin time
   */
  private async checkAndLockPicks(): Promise<void> {
    try {
      const dayOfWeek = getDublinDayOfWeek();
      const hour = getDublinHour();

      console.log(
        `🔒 Pick locking check: Dublin time (Day: ${dayOfWeek}, Hour: ${hour})`
      );

      // Only lock on Saturday (day 6) at 12 PM (hour 12) Dublin time
      if (dayOfWeek === 6 && hour === 12) {
        console.log(
          "📅 Saturday 12 PM Dublin time detected - locking all picks for current week"
        );
        await this.lockCurrentWeekPicks();
      } else {
        console.log(
          "⏭️  Not Saturday 12 PM Dublin time, skipping pick locking"
        );
      }
    } catch (error) {
      console.error("❌ Error in pick locking scheduler:", error);
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
          status: "submitted",
        },
        data: {
          status: "locked",
          lockedAtUtc: new Date(),
        },
      });

      console.log(`✅ Locked ${result.count} pick sets for ${currentWeekId}`);

      // Log details for monitoring
      const lockedSets = await this.prisma.pickSet.findMany({
        where: {
          weekId: currentWeekId,
          status: "locked",
        },
        include: {
          user: {
            select: { username: true, email: true },
          },
        },
      });

      console.log(
        `📊 Total locked pick sets for ${currentWeekId}: ${lockedSets.length}`
      );
      lockedSets.forEach((pickSet) => {
        console.log(
          `   - ${pickSet.user.username || pickSet.user.email}: locked at ${
            pickSet.lockedAtUtc
          }`
        );
      });
    } catch (error) {
      console.error("❌ Error locking picks for current week:", error);
    }
  }

  /**
   * Check if current week picks are locked (Saturday 12 PM Dublin time has passed)
   */
  async arePicksLockedForCurrentWeek(): Promise<boolean> {
    return !arePicksOpen();
  }

  /**
   * Get the Saturday 12 PM deadline for a given week (in Dublin timezone)
   */
  getSaturdayNoonForWeek(weekId: string): Date {
    // Extract week number from weekId (e.g., "2025-W4" -> 4)
    const weekMatch = weekId.match(/(\d{4})-W(\d+)/);
    if (!weekMatch) {
      throw new Error(`Invalid week ID format: ${weekId}`);
    }

    const year = parseInt(weekMatch[1]);
    const weekNumber = parseInt(weekMatch[2]);

    // NFL 2025 season starts Friday, September 5, 2025 at 5:00 AM Dublin time (IST = UTC+1)
    const seasonStartDublin = new Date("2025-09-05T05:00:00+01:00");

    // Calculate the Friday start of this week (5 AM Dublin time)
    const daysFromSeasonStart = (weekNumber - 1) * 7;
    const weekStartFriday = new Date(seasonStartDublin.getTime());
    weekStartFriday.setDate(seasonStartDublin.getDate() + daysFromSeasonStart);

    // Saturday is the day after Friday, at 12 PM (7 hours after Friday 5 AM)
    const saturdayNoon = new Date(weekStartFriday.getTime());
    saturdayNoon.setDate(weekStartFriday.getDate() + 1);
    saturdayNoon.setHours(weekStartFriday.getHours() + 7); // 5 AM + 7 = 12 PM

    return saturdayNoon;
  }

  /**
   * Stop the pick locking scheduler
   */
  stopPickLockingScheduler(): void {
    if (this.lockingInterval) {
      clearInterval(this.lockingInterval);
      this.lockingInterval = null;
      console.log("⏹️  Pick locking scheduler stopped");
    }
  }

  /**
   * Check if we need to send picks open notification (Friday 5 AM Dublin time)
   */
  private async checkAndSendPicksOpenNotification(): Promise<void> {
    try {
      const dayOfWeek = getDublinDayOfWeek();
      const hour = getDublinHour();

      console.log(
        `📬 Picks open notification check: Dublin time (Day: ${dayOfWeek}, Hour: ${hour})`
      );

      // Only send on Friday (day 5) at 5 AM (hour 5) Dublin time
      if (dayOfWeek === 5 && hour === 5) {
        const currentWeekId = getCurrentWeekIdSync();

        // Check if we already sent notification this week
        const existingNotification =
          await this.prisma.notificationLog.findFirst({
            where: {
              type: "picks_open",
              title: {
                contains: currentWeekId,
              },
              sentAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
              },
            },
          });

        if (existingNotification) {
          console.log(
            `⏭️  Picks open notification already sent for ${currentWeekId} today`
          );
          return;
        }

        console.log(
          `🏈 Friday 5 AM Dublin time detected - sending picks open notifications for ${currentWeekId}`
        );
        await this.notificationService.sendPicksOpenNotifications(
          currentWeekId
        );
      } else {
        console.log(
          "⏭️  Not Friday 5 AM Dublin time, skipping picks open notification"
        );
      }
    } catch (error) {
      console.error("❌ Error in picks open notification scheduler:", error);
    }
  }

  /**
   * Manual trigger for testing - lock picks immediately
   */
  async lockPicksNow(): Promise<void> {
    console.log("🔒 Manual pick locking triggered");
    await this.lockCurrentWeekPicks();
  }

  /**
   * Manual trigger for testing - send picks open notification immediately
   */
  async sendPicksOpenNow(): Promise<void> {
    console.log("📬 Manual picks open notification triggered");
    const currentWeekId = getCurrentWeekIdSync();
    await this.notificationService.sendPicksOpenNotifications(currentWeekId);
  }
}
