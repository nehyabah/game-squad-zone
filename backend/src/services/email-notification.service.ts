import { PrismaClient } from "@prisma/client";
import { webcrypto } from "node:crypto";
import { createHmac } from "node:crypto";
import { EmailClient } from "@azure/communication-email";

// Polyfill globalThis.crypto for Node 18 (Azure SDK requires it)
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

type RecipientFilter = "all" | "active_players" | "missing_picks" | "specific";

interface Recipient {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

interface SendResult {
  logId: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  status: string;
}

// ── Design Tokens ─────────────────────────────────────────────────────
const T = {
  black: "#1d1d1f",
  gray1: "#6e6e73",
  gray2: "#86868b",
  gray3: "#d2d2d7",
  gray4: "#f5f5f7",
  white: "#ffffff",
  green: "#2db54b",
  greenDark: "#1a5c32",
  greenLight: "#f0fdf4",
  greenBorder: "#bbf7d0",
  orange: "#ff9f0a",
  red: "#ff3b30",
  blue: "#0071e3",
  font: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
};

export class EmailNotificationService {
  private emailClient: EmailClient | null = null;
  private senderAddress: string;

  constructor(private prisma: PrismaClient) {
    const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
    this.senderAddress = process.env.EMAIL_SENDER_ADDRESS || "";

    if (connectionString) {
      this.emailClient = new EmailClient(connectionString);
    }
  }

  // ── Unsubscribe Token Helpers ─────────────────────────────────────────

  private get unsubscribeSecret(): string {
    return (
      process.env.EMAIL_UNSUBSCRIBE_SECRET ||
      process.env.AZURE_COMMUNICATION_CONNECTION_STRING ||
      "fallback-dev-secret"
    );
  }

  generateUnsubscribeToken(userId: string): string {
    const hmac = createHmac("sha256", this.unsubscribeSecret)
      .update(userId)
      .digest("base64url");
    const payload = `${userId}:${hmac}`;
    return Buffer.from(payload).toString("base64url");
  }

  verifyUnsubscribeToken(token: string): string | null {
    try {
      const decoded = Buffer.from(token, "base64url").toString("utf-8");
      const colonIdx = decoded.indexOf(":");
      if (colonIdx === -1) return null;

      const userId = decoded.substring(0, colonIdx);
      const providedHmac = decoded.substring(colonIdx + 1);

      const expectedHmac = createHmac("sha256", this.unsubscribeSecret)
        .update(userId)
        .digest("base64url");

      if (providedHmac !== expectedHmac) return null;
      return userId;
    } catch {
      return null;
    }
  }

  async unsubscribeUser(token: string): Promise<{ success: boolean; message: string }> {
    const userId = this.verifyUnsubscribeToken(token);
    if (!userId) {
      return { success: false, message: "Invalid or expired unsubscribe link." };
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: "User not found." };
    }

    if (user.emailUnsubscribed) {
      return { success: true, message: "You're already unsubscribed." };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailUnsubscribed: true },
    });

    return { success: true, message: "You've been unsubscribed. You won't receive any more emails from SquadPot." };
  }

  buildUnsubscribeHtml(success: boolean, message: string): string {
    const icon = success
      ? `<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="${T.green}" opacity="0.1"/><path d="M16 24.5L21.5 30L32 18" stroke="${T.green}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      : `<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="${T.red}" opacity="0.1"/><path d="M18 18L30 30M30 18L18 30" stroke="${T.red}" stroke-width="2.5" stroke-linecap="round"/></svg>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe — SquadPot</title>
</head>
<body style="margin:0;padding:0;background-color:${T.gray4};font-family:${T.font};-webkit-font-smoothing:antialiased;">
  <div style="max-width:420px;margin:0 auto;padding:80px 24px;">
    <div style="text-align:center;">
      <p style="margin:0 0 48px;font-size:21px;font-weight:600;letter-spacing:-0.01em;color:${T.black};">SquadPot</p>
      <div style="margin:0 0 24px;">${icon}</div>
      <p style="margin:0 0 8px;font-size:19px;font-weight:600;color:${T.black};letter-spacing:-0.01em;">${success ? "You're unsubscribed" : "Something went wrong"}</p>
      <p style="margin:0;font-size:14px;color:${T.gray2};line-height:1.5;">${message}</p>
    </div>
  </div>
</body>
</html>`;
  }

  private getUnsubscribeUrl(userId: string): string {
    const baseUrl =
      process.env.EMAIL_UNSUBSCRIBE_BASE_URL ||
      process.env.VITE_API_URL ||
      "http://localhost:3001";
    const token = this.generateUnsubscribeToken(userId);
    return `${baseUrl}/api/six-nations/email/unsubscribe?token=${token}`;
  }

  private ensureClient(): EmailClient {
    if (!this.emailClient) {
      throw new Error(
        "Email service not configured. Set AZURE_COMMUNICATION_CONNECTION_STRING env var."
      );
    }
    return this.emailClient;
  }

  // ── Recipient Resolution ──────────────────────────────────────────────

  async getRecipients(
    filter: RecipientFilter,
    roundId?: string,
    specificUserIds?: string[]
  ): Promise<Recipient[]> {
    if (filter === "specific" && specificUserIds?.length) {
      return this.prisma.user.findMany({
        where: { id: { in: specificUserIds }, status: "active", emailUnsubscribed: false },
        select: {
          id: true, email: true, username: true,
          displayName: true, firstName: true, lastName: true,
        },
      });
    }

    if (filter === "missing_picks" && roundId) {
      const questions = await this.prisma.sixNationsQuestion.findMany({
        where: { match: { roundId } },
        select: { id: true },
      });
      const questionIds = questions.map((q) => q.id);
      const totalQuestions = questionIds.length;

      if (totalQuestions === 0) return [];

      const allUsers = await this.prisma.user.findMany({
        where: { status: "active", emailUnsubscribed: false },
        select: {
          id: true, email: true, username: true,
          displayName: true, firstName: true, lastName: true,
          sixNationsAnswers: {
            where: { questionId: { in: questionIds } },
            select: { id: true },
          },
        },
      });

      return allUsers
        .filter((u) => u.sixNationsAnswers.length < totalQuestions)
        .map(({ sixNationsAnswers, ...user }) => user);
    }

    if (filter === "active_players") {
      return this.prisma.user.findMany({
        where: {
          status: "active",
          emailUnsubscribed: false,
          sixNationsAnswers: { some: {} },
        },
        select: {
          id: true, email: true, username: true,
          displayName: true, firstName: true, lastName: true,
        },
      });
    }

    // "all" — all Six Nations participants
    return this.prisma.user.findMany({
      where: {
        status: "active",
        emailUnsubscribed: false,
        sixNationsAnswers: { some: {} },
      },
      select: {
        id: true, email: true, username: true,
        displayName: true, firstName: true, lastName: true,
      },
    });
  }

  // ── Send Round Results ────────────────────────────────────────────────

  async sendRoundResults(
    roundId: string,
    sentBy: string,
    filter?: RecipientFilter,
    specificUserIds?: string[]
  ): Promise<SendResult> {
    const round = await this.prisma.sixNationsRound.findUnique({
      where: { id: roundId },
      include: {
        matches: {
          include: {
            questions: {
              include: {
                answers: {
                  include: {
                    user: {
                      select: {
                        id: true, email: true, username: true,
                        displayName: true, firstName: true, lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!round) throw new Error("Round not found");

    const userScores = new Map<
      string,
      { user: Recipient; totalPoints: number; correctAnswers: number; totalAnswers: number }
    >();

    for (const match of round.matches) {
      for (const question of match.questions) {
        for (const answer of question.answers) {
          const existing = userScores.get(answer.userId) || {
            user: answer.user,
            totalPoints: 0,
            correctAnswers: 0,
            totalAnswers: 0,
          };
          existing.totalAnswers += 1;
          if (answer.isCorrect === true) {
            existing.totalPoints += question.points;
            existing.correctAnswers += 1;
          }
          userScores.set(answer.userId, existing);
        }
      }
    }

    const sorted = Array.from(userScores.values()).sort(
      (a, b) => b.totalPoints - a.totalPoints
    );

    const ranked = sorted.map((entry, i) => ({ ...entry, rank: i + 1 }));

    let filteredRanked = ranked;
    if (filter && filter !== "all") {
      const allowedRecipients = await this.getRecipients(filter, roundId, specificUserIds);
      const allowedIds = new Set(allowedRecipients.map((r) => r.id));
      filteredRanked = ranked.filter((entry) => allowedIds.has(entry.user.id));
    }

    if (filteredRanked.length === 0) throw new Error("No recipients match the filter");

    const log = await this.prisma.sixNationsEmailLog.create({
      data: {
        type: "round_results",
        subject: `Your ${round.name} results`,
        recipientCount: ranked.length,
        sentBy,
        roundId,
        status: "sending",
      },
    });

    const recipients = filteredRanked.map((entry) => {
      const name = entry.user.displayName || entry.user.firstName || entry.user.username;
      const rankSuffix = entry.rank === 1 ? "st" : entry.rank === 2 ? "nd" : entry.rank === 3 ? "rd" : "th";
      const accuracy = entry.totalAnswers > 0 ? Math.round((entry.correctAnswers / entry.totalAnswers) * 100) : 0;
      const unsubUrl = this.getUnsubscribeUrl(entry.user.id);
      const subjectEmoji = entry.rank === 1 ? "🏆 " : entry.rank === 2 ? "🥈 " : entry.rank === 3 ? "🥉 " : "";
      return {
        recipient: entry.user,
        subject: `${subjectEmoji}Your ${round.name} results`,
        html: this.buildRoundResultsHtml(
          round.name,
          entry.rank,
          ranked.length,
          entry.totalPoints,
          entry.correctAnswers,
          entry.totalAnswers,
          name,
          entry.user.id
        ),
        plainText: [
          `Hi ${name},`,
          ``,
          `${round.name} results are in!`,
          ``,
          `Your rank: ${entry.rank}${rankSuffix} of ${filteredRanked.length} players`,
          `Points: ${entry.totalPoints}`,
          `Correct: ${entry.correctAnswers}/${entry.totalAnswers} (${accuracy}%)`,
          ``,
          `Open SquadPot to see the full leaderboard.`,
          ``,
          `-- SquadPot · Six Nations Picks`,
          `To unsubscribe: ${unsubUrl}`,
        ].join("\n"),
      };
    });

    const result = await this.sendBatch(recipients);

    await this.prisma.sixNationsEmailLog.update({
      where: { id: log.id },
      data: {
        successCount: result.successCount,
        failureCount: result.failureCount,
        status: this.computeStatus(result),
        completedAt: new Date(),
        details: result.errors.length ? { errors: result.errors } : undefined,
      },
    });

    await this.createAuditEntry(sentBy, "send_round_results", log.id, {
      roundId,
      roundName: round.name,
      recipientCount: ranked.length,
      successCount: result.successCount,
    });

    return {
      logId: log.id,
      recipientCount: ranked.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      status: this.computeStatus(result),
    };
  }

  // ── Send Picks Open Reminder ──────────────────────────────────────────

  async sendPicksOpenReminder(
    roundId: string,
    filter: RecipientFilter,
    sentBy: string,
    specificUserIds?: string[]
  ): Promise<SendResult> {
    const round = await this.prisma.sixNationsRound.findUnique({
      where: { id: roundId },
    });
    if (!round) throw new Error("Round not found");

    const recipients = await this.getRecipients(filter, roundId, specificUserIds);
    if (recipients.length === 0) throw new Error("No recipients match the filter");

    const subject = `Your ${round.name} picks are ready`;

    const log = await this.prisma.sixNationsEmailLog.create({
      data: {
        type: "picks_reminder",
        subject,
        recipientCount: recipients.length,
        sentBy,
        roundId,
        status: "sending",
      },
    });

    const deadlineDate = new Date(round.endDate);
    const deadlineDay = deadlineDate.toLocaleDateString("en-GB", { weekday: "long" });
    const deadlineDate2 = deadlineDate.toLocaleDateString("en-GB", { day: "numeric", month: "long" });

    const emails = recipients.map((r) => {
      const name = r.displayName || r.firstName || r.username;
      const unsubUrl = this.getUnsubscribeUrl(r.id);
      return {
        recipient: r,
        subject,
        html: this.buildPicksReminderHtml(round.name, round.endDate.toISOString(), name, r.id),
        plainText: [
          `Hi ${name},`,
          ``,
          `${round.name} is now open for predictions.`,
          ``,
          `Deadline: ${deadlineDay}, ${deadlineDate2}`,
          `Picks lock 1 hour before each kickoff.`,
          ``,
          `Open SquadPot to submit your picks.`,
          ``,
          `-- SquadPot · Six Nations Picks`,
          `To unsubscribe: ${unsubUrl}`,
        ].join("\n"),
      };
    });

    const result = await this.sendBatch(emails);

    await this.prisma.sixNationsEmailLog.update({
      where: { id: log.id },
      data: {
        successCount: result.successCount,
        failureCount: result.failureCount,
        status: this.computeStatus(result),
        completedAt: new Date(),
        details: result.errors.length ? { errors: result.errors } : undefined,
      },
    });

    await this.createAuditEntry(sentBy, "send_picks_reminder", log.id, {
      roundId,
      roundName: round.name,
      filter,
      recipientCount: recipients.length,
      successCount: result.successCount,
    });

    return {
      logId: log.id,
      recipientCount: recipients.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      status: this.computeStatus(result),
    };
  }

  // ── Send Custom Announcement ──────────────────────────────────────────

  async sendCustomAnnouncement(
    subject: string,
    body: string,
    filter: RecipientFilter,
    sentBy: string,
    roundId?: string,
    specificUserIds?: string[]
  ): Promise<SendResult> {
    const recipients = await this.getRecipients(filter, roundId, specificUserIds);
    if (recipients.length === 0) throw new Error("No recipients match the filter");

    const log = await this.prisma.sixNationsEmailLog.create({
      data: {
        type: "custom",
        subject,
        recipientCount: recipients.length,
        sentBy,
        roundId: roundId || null,
        status: "sending",
      },
    });

    const emails = recipients.map((r) => {
      const name = r.displayName || r.firstName || r.username;
      const personalizedBody = body
        .replace(/\{\{displayName\}\}/g, name)
        .replace(/\{\{firstName\}\}/g, r.firstName || r.username)
        .replace(/\{\{username\}\}/g, r.username);
      const unsubUrl = this.getUnsubscribeUrl(r.id);

      return {
        recipient: r,
        subject,
        html: this.buildCustomHtml(subject, personalizedBody, name, r.id),
        plainText: [
          `Hi ${name},`,
          ``,
          personalizedBody.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""),
          ``,
          `-- SquadPot · Six Nations Picks`,
          `To unsubscribe: ${unsubUrl}`,
        ].join("\n"),
      };
    });

    const result = await this.sendBatch(emails);

    await this.prisma.sixNationsEmailLog.update({
      where: { id: log.id },
      data: {
        successCount: result.successCount,
        failureCount: result.failureCount,
        status: this.computeStatus(result),
        completedAt: new Date(),
        details: result.errors.length ? { errors: result.errors } : undefined,
      },
    });

    await this.createAuditEntry(sentBy, "send_custom_email", log.id, {
      subject,
      filter,
      recipientCount: recipients.length,
      successCount: result.successCount,
    });

    return {
      logId: log.id,
      recipientCount: recipients.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      status: this.computeStatus(result),
    };
  }

  // ── History ───────────────────────────────────────────────────────────

  async getHistory(limit?: number, type?: string) {
    const where: any = {};
    if (type) where.type = type;

    const logs = await this.prisma.sixNationsEmailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    const userIds = [...new Set(logs.map((l) => l.sentBy))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return logs.map((log) => ({
      ...log,
      sentByUser: userMap.get(log.sentBy) || null,
    }));
  }

  // ── Private: Send Single Email ────────────────────────────────────────

  private async sendSingleEmail(
    recipientEmail: string,
    subject: string,
    html: string,
    userId?: string,
    plainText?: string
  ): Promise<void> {
    const client = this.ensureClient();

    const headers: Record<string, string> = {};
    if (userId) {
      const unsubscribeUrl = this.getUnsubscribeUrl(userId);
      headers["List-Unsubscribe"] = `<${unsubscribeUrl}>`;
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }

    const message = {
      senderAddress: this.senderAddress,
      ...(Object.keys(headers).length > 0 && { headers }),
      content: {
        subject,
        html,
        ...(plainText && { plainText }),
      },
      recipients: { to: [{ address: recipientEmail }] },
    };

    const poller = await client.beginSend(message);
    await poller.pollUntilDone();
  }

  // ── Private: Batch Send ───────────────────────────────────────────────

  private async sendBatch(
    emails: { recipient: Recipient; subject: string; html: string; plainText?: string }[]
  ): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
    const BATCH_SIZE = 10;
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((e) =>
          this.sendSingleEmail(e.recipient.email, e.subject, e.html, e.recipient.id, e.plainText)
        )
      );

      for (let j = 0; j < results.length; j++) {
        if (results[j].status === "fulfilled") {
          successCount++;
        } else {
          failureCount++;
          const reason = (results[j] as PromiseRejectedResult).reason;
          errors.push(`${batch[j].recipient.email}: ${reason?.message || "Unknown error"}`);
        }
      }

      if (i + BATCH_SIZE < emails.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return { successCount, failureCount, errors };
  }

  private computeStatus(result: { successCount: number; failureCount: number }): string {
    if (result.failureCount === 0) return "completed";
    if (result.successCount === 0) return "failed";
    return "partial_failure";
  }

  private async createAuditEntry(
    performedBy: string,
    action: string,
    logId: string,
    details: Record<string, any>
  ) {
    await this.prisma.sixNationsAuditLog.create({
      data: {
        action,
        performedBy,
        targetType: "email_log",
        targetId: logId,
        details,
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  //  HTML TEMPLATES — Apple-inspired minimal design
  // ══════════════════════════════════════════════════════════════════════

  private get appUrl(): string {
    return process.env.EMAIL_APP_URL || process.env.FRONTEND_URL || "#";
  }

  private baseWrapper(content: string, userId?: string, roundContext?: string): string {
    const unsubLink = userId
      ? `<a href="${this.getUnsubscribeUrl(userId)}" style="color:${T.gray2};font-size:12px;text-decoration:none;">Unsubscribe</a>`
      : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>SquadPot</title>
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .eo { padding: 20px 12px !important; }
      .ec { width: 100% !important; }
      .eh { padding: 18px 22px !important; }
      .eb { padding: 26px 22px 30px !important; }
      .e1 { font-size: 21px !important; line-height: 1.3 !important; }
      .ep { padding: 20px 16px !important; }
      .er { font-size: 46px !important; }
      .es { padding: 14px 6px !important; }
      .en { font-size: 22px !important; }
      .ed { padding: 16px 18px !important; }
      .edt { font-size: 17px !important; }
      .ef { padding: 18px 0 0 !important; }
      .btn {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        padding: 16px 20px !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${T.gray4};font-family:${T.font};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${T.gray4}">
    <tr>
      <td class="eo" align="center" style="padding:40px 20px;">
        <table class="ec" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;width:100%;">

          <!-- Card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Green Header -->
                <tr>
                  <td class="eh" style="background-color:${T.greenDark};border-radius:16px 16px 0 0;padding:24px 36px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle">
                          <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;letter-spacing:0.06em;text-transform:uppercase;">SquadPot</p>
                          <p style="margin:3px 0 0;font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:0.01em;">Six Nations Picks Game</p>
                        </td>
                        ${roundContext ? `<td align="right" valign="middle" style="padding-left:12px;"><p style="margin:0;font-size:11px;font-weight:600;color:rgba(255,255,255,0.5);letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;">${roundContext}</p></td>` : ""}
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- White Body -->
                <tr>
                  <td class="eb" style="background-color:${T.white};border-radius:0 0 16px 16px;padding:36px 36px 40px;">
                    ${content}
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="ef" style="padding:24px 0 0;text-align:center;">
              <p style="margin:0 0 6px;color:${T.gray2};font-size:12px;">Six Nations Picks &middot; SquadPot</p>
              ${unsubLink ? `<p style="margin:0;">${unsubLink}</p>` : ""}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private buildRoundResultsHtml(
    roundName: string,
    rank: number,
    totalPlayers: number,
    totalPoints: number,
    correctAnswers: number,
    totalAnswers: number,
    name: string,
    userId?: string
  ): string {
    const rankSuffix = rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th";
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
    const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏅";
    const greeting = rank <= 3 ? `Brilliant work, ${name}! ${rankEmoji}` : `Nice effort, ${name}.`;

    const confettiRow = rank === 1
      ? `<p style="text-align:center;font-size:26px;letter-spacing:6px;margin:0 0 20px;line-height:1;">&#127882; &#127881; &#127881; &#127882;</p>`
      : rank <= 3
      ? `<p style="text-align:center;font-size:22px;letter-spacing:4px;margin:0 0 20px;line-height:1;">&#127881; &#10024; &#127881;</p>`
      : `<p style="text-align:center;font-size:20px;letter-spacing:4px;margin:0 0 20px;line-height:1;">&#10024; &#10024; &#10024;</p>`;

    const rankBg     = rank === 1 ? "#fffbeb" : T.greenLight;
    const rankBorder = rank === 1 ? "#fde68a" : T.greenBorder;
    const rankLabel  = rank === 1 ? "#92400e" : "#15803d";

    return this.baseWrapper(`
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:${T.green};letter-spacing:0.08em;text-transform:uppercase;">Results</p>
      <h1 class="e1" style="margin:0 0 8px;font-size:26px;font-weight:700;color:${T.black};letter-spacing:-0.02em;line-height:1.25;">${greeting}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:${T.gray1};line-height:1.6;">${roundName} is done. Here's how you ranked against the squad this round.</p>

      ${confettiRow}

      <!-- Rank block -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr>
          <td class="ep" align="center" style="background-color:${rankBg};border:1px solid ${rankBorder};border-radius:12px;padding:28px 24px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:${rankLabel};letter-spacing:0.08em;text-transform:uppercase;">Your Rank</p>
            <p class="er" style="margin:0;font-size:58px;font-weight:800;color:${T.black};letter-spacing:-0.04em;line-height:1;">${rank}<sup style="font-size:20px;font-weight:600;color:${T.gray1};vertical-align:super;line-height:0;">${rankSuffix}</sup></p>
            <p style="margin:8px 0 0;font-size:13px;color:${T.gray1};">of ${totalPlayers} players</p>
          </td>
        </tr>
      </table>

      <!-- Stats row -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr>
          <td class="es" width="32%" style="padding:18px 12px;text-align:center;background-color:${T.gray4};border-radius:10px 0 0 10px;">
            <p class="en" style="margin:0 0 4px;font-size:28px;font-weight:700;color:${T.black};letter-spacing:-0.02em;">${totalPoints}</p>
            <p style="margin:0;font-size:11px;font-weight:500;color:${T.gray2};text-transform:uppercase;letter-spacing:0.05em;">Points</p>
          </td>
          <td width="2px" style="background-color:${T.white};"></td>
          <td class="es" width="32%" style="padding:18px 12px;text-align:center;background-color:${T.gray4};">
            <p class="en" style="margin:0 0 4px;font-size:28px;font-weight:700;color:${T.black};letter-spacing:-0.02em;">${correctAnswers}<span style="font-size:15px;font-weight:400;color:${T.gray2};">/${totalAnswers}</span></p>
            <p style="margin:0;font-size:11px;font-weight:500;color:${T.gray2};text-transform:uppercase;letter-spacing:0.05em;">Correct</p>
          </td>
          <td width="2px" style="background-color:${T.white};"></td>
          <td class="es" width="32%" style="padding:18px 12px;text-align:center;background-color:${T.gray4};border-radius:0 10px 10px 0;">
            <p class="en" style="margin:0 0 4px;font-size:28px;font-weight:700;color:${T.black};letter-spacing:-0.02em;">${accuracy}%</p>
            <p style="margin:0;font-size:11px;font-weight:500;color:${T.gray2};text-transform:uppercase;letter-spacing:0.05em;">Accuracy</p>
          </td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid ${T.gray3};margin:0 0 28px;">

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <a href="${this.appUrl}" class="btn" style="display:inline-block;background-color:${T.greenDark};color:${T.white};font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:980px;letter-spacing:-0.01em;">View Leaderboard &rarr;</a>
          </td>
        </tr>
      </table>
    `, userId, roundName);
  }

  private buildPicksReminderHtml(
    roundName: string,
    deadline: string,
    name: string,
    userId?: string
  ): string {
    const deadlineDate = new Date(deadline);
    const day = deadlineDate.toLocaleDateString("en-GB", { weekday: "long" });
    const date = deadlineDate.toLocaleDateString("en-GB", { day: "numeric", month: "long" });

    return this.baseWrapper(`
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:${T.green};letter-spacing:0.08em;text-transform:uppercase;">&#127945; Picks Now Open</p>
      <h1 class="e1" style="margin:0 0 8px;font-size:26px;font-weight:700;color:${T.black};letter-spacing:-0.02em;line-height:1.25;">${roundName}</h1>
      <p style="margin:0 0 28px;font-size:15px;color:${T.gray1};line-height:1.6;">Hi ${name}, this round is open for predictions. Submit your picks before the first match kicks off.</p>

      <!-- Deadline box -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
        <tr>
          <td class="ed" style="background-color:${T.gray4};border-left:4px solid ${T.green};border-radius:0 10px 10px 0;padding:20px 24px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:${T.green};letter-spacing:0.07em;text-transform:uppercase;">Deadline</p>
            <p class="edt" style="margin:0;font-size:19px;font-weight:700;color:${T.black};letter-spacing:-0.01em;">${day}, ${date}</p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 32px;font-size:13px;color:${T.gray2};line-height:1.5;">Picks lock automatically 1 hour before each kickoff. Don't miss out.</p>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <a href="${this.appUrl}" class="btn" style="display:inline-block;background-color:${T.greenDark};color:${T.white};font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:980px;letter-spacing:-0.01em;">Make Your Picks &rarr;</a>
          </td>
        </tr>
      </table>
    `, userId, `${roundName} &middot; Open`);
  }

  private buildCustomHtml(
    subject: string,
    body: string,
    name: string,
    userId?: string
  ): string {
    const htmlBody = body.replace(/\n/g, "<br>");

    return this.baseWrapper(`
      <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:${T.black};letter-spacing:-0.02em;line-height:1.25;">Hey ${name},</h1>
      <div style="color:${T.gray1};font-size:16px;line-height:1.7;letter-spacing:-0.01em;">
        ${htmlBody}
      </div>
    `, userId);
  }
}
