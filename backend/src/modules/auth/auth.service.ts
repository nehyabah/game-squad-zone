// src/modules/auth/auth.service.ts
import type { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { add } from "date-fns";
import createError from "@fastify/error";

// Create custom errors if httpErrors plugin isn't installed
const UnauthorizedError = createError("UNAUTHORIZED", "%s", 401);

export class AuthService {
  constructor(private app: FastifyInstance, private prisma: PrismaClient) {}

  private signAccess(user: { id: string; email: string }) {
    const ttl = process.env.ACCESS_TTL || "15m";
    return this.app.jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      { expiresIn: ttl }
    );
  }

  private async createRefreshSession(
    userId: string,
    userEmail: string,
    userAgent?: string,
    ip?: string
  ) {
    const ttl = process.env.REFRESH_TTL || "30d";
    const expiresAt = add(new Date(), this.parseTtl(ttl));

    const token = this.app.jwt.sign(
      {
        sub: userId,
        email: userEmail,
        typ: "refresh",
      },
      { expiresIn: ttl }
    );

    await this.prisma.session.create({
      data: { userId, token, expiresAt, userAgent, ipAddress: ip },
    });

    return { token, expiresAt };
  }

  private parseTtl(ttl: string) {
    const m = ttl.match(/^(\d+)([smhd])$/);
    if (!m) return { minutes: 15 };
    const n = Number(m[1]);
    const unit = m[2];
    return unit === "s"
      ? { seconds: n }
      : unit === "m"
      ? { minutes: n }
      : unit === "h"
      ? { hours: n }
      : { days: n };
  }

  async oktaExchange(idToken: string, userAgent?: string, ip?: string) {
    const payload = await this.app.verifyOktaIdToken(idToken);

    console.log("Token payload:", payload); // Debug log

    const sub = String(payload.sub);

    // Auth0 doesn't always include email in ID token
    // Extract email from sub if it contains an email, or generate a placeholder
    let email = String(payload.email || "");

    if (!email) {
      // If sub contains an email (some providers do this)
      if (sub.includes("@")) {
        email = sub;
      } else {
        // Generate a placeholder email
        const cleanSub = sub.replace(/[^a-zA-Z0-9]/g, "_");
        email = `${cleanSub}@auth0.local`;
      }
    }

    console.log("Extracted - sub:", sub, "email:", email); // Debug log

    if (!sub) {
      throw new UnauthorizedError("Invalid token - missing subject");
    }

    // Generate username from sub or email
    let username = email.split("@")[0];
    // Remove auth0| prefix if present
    if (sub.startsWith("auth0|")) {
      username = sub.replace("auth0|", "user_");
    }

    // Ensure username is unique by checking and appending number if needed
    let finalUsername = username;
    let counter = 0;
    while (
      await this.prisma.user.findUnique({ where: { username: finalUsername } })
    ) {
      counter++;
      finalUsername = `${username}_${counter}`;
    }

    // Upsert user
    const user = await this.prisma.user.upsert({
      where: { oktaId: sub },
      create: {
        oktaId: sub,
        email,
        username: finalUsername,
        firstName: payload.given_name as string | undefined,
        lastName: payload.family_name as string | undefined,
        avatarUrl: payload.picture as string | undefined,
        emailVerified: Boolean(payload.email_verified),
        authProvider: "okta",
        status: "active",
        lastLoginAt: new Date(),
      },
      update: {
        email,
        firstName: payload.given_name as string | undefined,
        lastName: payload.family_name as string | undefined,
        avatarUrl: payload.picture as string | undefined,
        emailVerified: Boolean(payload.email_verified),
        lastLoginAt: new Date(),
      },
      select: { id: true, email: true },
    });

    const accessToken = this.signAccess(user);
    const { token: refreshToken, expiresAt } = await this.createRefreshSession(
      user.id,
      user.email,
      userAgent,
      ip
    );

    return { accessToken, refreshToken, refreshExpiresAt: expiresAt };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.app.jwt.verify<{
        sub: string;
        email: string;
        typ: string;
      }>(refreshToken);

      if (payload.typ !== "refresh") {
        throw new UnauthorizedError("Invalid token type");
      }

      const session = await this.prisma.session.findUnique({
        where: { token: refreshToken },
      });

      if (!session || session.revokedAt || session.expiresAt < new Date()) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, status: true },
      });

      if (!user || user.status !== "active") {
        throw new UnauthorizedError("User not active");
      }

      const accessToken = this.signAccess({ id: user.id, email: user.email });
      return { accessToken };
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;
    await this.prisma.session.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }
}
