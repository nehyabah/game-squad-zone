import webpush from "web-push";
import { PrismaClient } from "@prisma/client";

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: "pick_reminder" | "score_update" | "window_event" | "picks_open" | "join_request" | "join_approved" | "join_rejected";
  data?: any;
}

export class PushNotificationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;

    // Configure VAPID details for web push
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribe(
    userId: string,
    subscription: PushSubscription,
    userAgent?: string
  ): Promise<void> {
    try {
      console.log(`📱 Subscribing user ${userId} to push notifications`);

      // Store subscription in database
      await this.prisma.pushSubscription.upsert({
        where: { endpoint: subscription.endpoint },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          active: true,
          updatedAt: new Date(),
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          active: true,
        },
      });

      console.log(`✅ User ${userId} subscribed successfully`);
    } catch (error) {
      console.error(`❌ Error subscribing user ${userId}:`, error);
      throw new Error("Failed to subscribe to notifications");
    }
  }

  /**
   * Unsubscribe a user from push notifications
   */
  async unsubscribe(userId: string): Promise<void> {
    try {
      console.log(`📱 Unsubscribing user ${userId} from push notifications`);

      await this.prisma.pushSubscription.updateMany({
        where: { userId },
        data: { active: false },
      });

      console.log(`✅ User ${userId} unsubscribed successfully`);
    } catch (error) {
      console.error(`❌ Error unsubscribing user ${userId}:`, error);
      throw new Error("Failed to unsubscribe from notifications");
    }
  }

  /**
   * Send notification to a specific user
   */
  async sendToUser(
    userId: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      console.log(
        `🔔 Sending notification to user ${userId}: ${payload.title}`
      );

      // Get user's active subscriptions
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: {
          userId,
          active: true,
        },
      });

      if (subscriptions.length === 0) {
        console.log(`⚠️ No active subscriptions found for user ${userId}`);
        return;
      }

      // Send to all user's devices
      const promises = subscriptions.map((sub) =>
        this.sendPushNotification(sub, payload)
      );
      await Promise.allSettled(promises);

      // Log notification
      await this.prisma.notificationLog.create({
        data: {
          userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
        },
      });

      console.log(
        `✅ Notification sent to ${subscriptions.length} devices for user ${userId}`
      );
    } catch (error) {
      console.error(`❌ Error sending notification to user ${userId}:`, error);
    }
  }

  /**
   * Send notification to all active users
   */
  async sendToAll(payload: NotificationPayload): Promise<void> {
    try {
      console.log(`📢 Broadcasting notification: ${payload.title}`);

      // Get all active subscriptions
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { active: true },
        include: { user: { select: { id: true } } },
      });

      if (subscriptions.length === 0) {
        console.log("⚠️ No active subscriptions found");
        return;
      }

      // Send to all devices
      const promises = subscriptions.map((sub) =>
        this.sendPushNotification(sub, payload)
      );
      const results = await Promise.allSettled(promises);

      // Log notifications for each user
      const userIds = Array.from(
        new Set(subscriptions.map((sub) => sub.userId))
      );
      const logPromises = userIds.map((userId) =>
        this.prisma.notificationLog.create({
          data: {
            userId,
            type: payload.type,
            title: payload.title,
            message: payload.message,
          },
        })
      );
      await Promise.allSettled(logPromises);

      const successful = results.filter((r) => r.status === "fulfilled").length;
      console.log(
        `✅ Broadcast sent to ${successful}/${subscriptions.length} devices`
      );
    } catch (error) {
      console.error("❌ Error broadcasting notification:", error);
    }
  }

  /**
   * Send pick reminder notifications to users without picks
   */
  async sendPickReminders(weekId: string): Promise<void> {
    try {
      console.log(`⏰ Sending pick reminders for week ${weekId}`);

      // Find users without picks for the current week
      const usersWithoutPicks = await this.prisma.user.findMany({
        where: {
          pushSubscriptions: {
            some: { active: true },
          },
          NOT: {
            pickSets: {
              some: {
                weekId,
                status: { in: ["submitted", "locked"] },
              },
            },
          },
        },
        select: { id: true, displayName: true },
      });

      console.log(
        `📋 Found ${usersWithoutPicks.length} users without picks for ${weekId}`
      );

      // Send reminders
      const promises = usersWithoutPicks.map((user) =>
        this.sendToUser(user.id, {
          title: "SquadPot Reminder",
          message: `Don't forget to make your ${weekId} picks! Deadline is Saturday at noon.`,
          type: "pick_reminder",
          data: { weekId },
        })
      );

      await Promise.allSettled(promises);
      console.log(
        `✅ Pick reminders sent to ${usersWithoutPicks.length} users`
      );
    } catch (error) {
      console.error("❌ Error sending pick reminders:", error);
    }
  }

  /**
   * Send picks open notifications (Friday 5am)
   */
  async sendPicksOpenNotifications(weekId: string): Promise<void> {
    try {
      console.log(`🎮 Sending picks open notifications for ${weekId}`);

      // Get all users with active subscriptions
      const usersWithSubscriptions = await this.prisma.user.findMany({
        where: {
          pushSubscriptions: {
            some: { active: true },
          },
        },
        select: { id: true, displayName: true },
      });

      console.log(`📋 Sending to ${usersWithSubscriptions.length} users`);

      // Send notification to all users
      const promises = usersWithSubscriptions.map((user) =>
        this.sendToUser(user.id, {
          title: "Picks Are Open! 🏈",
          message: `${weekId} picks are now open! Make your picks before Saturday noon.`,
          type: "picks_open",
          data: { weekId },
        })
      );

      await Promise.allSettled(promises);
      console.log(
        `✅ Picks open notifications sent to ${usersWithSubscriptions.length} users`
      );
    } catch (error) {
      console.error("❌ Error sending picks open notifications:", error);
    }
  }

  /**
   * Send score update notifications
   */
  async sendScoreUpdates(weekId: string): Promise<void> {
    try {
      console.log(`🎯 Sending score updates for week ${weekId}`);

      // Find users with picks for this week
      const usersWithPicks = await this.prisma.user.findMany({
        where: {
          pushSubscriptions: {
            some: { active: true },
          },
          pickSets: {
            some: { weekId },
          },
        },
        include: {
          pickSets: {
            where: { weekId },
            include: {
              picks: {
                where: { status: { not: "pending" } },
              },
            },
          },
        },
      });

      console.log(`📊 Sending score updates to ${usersWithPicks.length} users`);

      // Send score updates
      const promises = usersWithPicks.map((user) => {
        const pickSet = user.pickSets[0];
        if (!pickSet) return Promise.resolve();

        const wins = pickSet.picks.filter((p) => p.status === "won").length;
        const losses = pickSet.picks.filter((p) => p.status === "lost").length;
        const pushes = pickSet.picks.filter(
          (p) => p.status === "pushed"
        ).length;
        const totalPoints = pickSet.picks
          .filter((p) => p.status === "won")
          .reduce(
            (sum, p) =>
              sum + (p.result ? parseInt(p.result.split(":")[1] || "0") : 0),
            0
          );

        return this.sendToUser(user.id, {
          title: `${weekId} Results`,
          message: `Your picks: ${wins}-${losses}-${pushes} (${totalPoints} points)`,
          type: "score_update",
          data: { weekId, wins, losses, pushes, totalPoints },
        });
      });

      await Promise.allSettled(promises);
      console.log(`✅ Score updates sent`);
    } catch (error) {
      console.error("❌ Error sending score updates:", error);
    }
  }

  /**
   * Clean up inactive subscriptions
   */
  async cleanupInactiveSubscriptions(): Promise<void> {
    try {
      console.log("🧹 Cleaning up inactive subscriptions...");

      const result = await this.prisma.pushSubscription.deleteMany({
        where: {
          OR: [
            { active: false },
            {
              updatedAt: {
                lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            }, // 30 days old
          ],
        },
      });

      console.log(`✅ Cleaned up ${result.count} inactive subscriptions`);
    } catch (error) {
      console.error("❌ Error cleaning up subscriptions:", error);
    }
  }

  /**
   * Send join request notification to squad admins/owners
   */
  async sendJoinRequestNotification(
    squadId: string,
    requesterId: string,
    requesterName: string,
    squadName: string
  ): Promise<void> {
    try {
      console.log(`🔔 Sending join request notification for squad ${squadId}`);

      // Get all admins and owners of the squad
      const adminMembers = await this.prisma.squadMember.findMany({
        where: {
          squadId,
          role: { in: ["owner", "admin"] },
        },
        select: { userId: true },
      });

      if (adminMembers.length === 0) {
        console.log(`⚠️ No admins/owners found for squad ${squadId}`);
        return;
      }

      // Send notification to each admin
      const promises = adminMembers.map((member) =>
        this.sendToUser(member.userId, {
          title: "New Join Request",
          message: `${requesterName} wants to join "${squadName}"`,
          type: "join_request",
          data: { squadId, requesterId, squadName },
        })
      );

      await Promise.allSettled(promises);
      console.log(
        `✅ Join request notification sent to ${adminMembers.length} admins`
      );
    } catch (error) {
      console.error("❌ Error sending join request notification:", error);
    }
  }

  /**
   * Send join request approved notification to user
   */
  async sendJoinApprovedNotification(
    userId: string,
    squadName: string,
    squadId: string
  ): Promise<void> {
    try {
      console.log(
        `✅ Sending join approved notification to user ${userId}`
      );

      await this.sendToUser(userId, {
        title: "Join Request Approved!",
        message: `You've been accepted to join "${squadName}"`,
        type: "join_approved",
        data: { squadId, squadName },
      });
    } catch (error) {
      console.error("❌ Error sending join approved notification:", error);
    }
  }

  /**
   * Send join request rejected notification to user
   */
  async sendJoinRejectedNotification(
    userId: string,
    squadName: string
  ): Promise<void> {
    try {
      console.log(
        `❌ Sending join rejected notification to user ${userId}`
      );

      await this.sendToUser(userId, {
        title: "Join Request Declined",
        message: `Your request to join "${squadName}" was declined`,
        type: "join_rejected",
        data: { squadName },
      });
    } catch (error) {
      console.error("❌ Error sending join rejected notification:", error);
    }
  }

  /**
   * Send push notification to a specific subscription
   */
  private async sendPushNotification(
    subscription: any,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      const notificationPayload = JSON.stringify({
        title: payload.title,
        message: payload.message,
        type: payload.type,
        data: payload.data || {},
        timestamp: Date.now(),
      });

      await webpush.sendNotification(pushSubscription, notificationPayload);
    } catch (error: any) {
      console.error(
        `❌ Push notification failed for subscription ${subscription.id}:`,
        error.message
      );

      // If subscription is invalid, mark as inactive
      if (error.statusCode === 410 || error.statusCode === 404) {
        await this.prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { active: false },
        });
        console.log(`📱 Marked subscription ${subscription.id} as inactive`);
      }

      throw error;
    }
  }
}

export default PushNotificationService;
