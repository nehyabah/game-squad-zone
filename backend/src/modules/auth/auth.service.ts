// src/modules/auth/auth.service.ts
import type { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";
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

    // Retry a few times in case of extremely rare token collisions
    for (let attempt = 0; attempt < 3; attempt++) {
      // Add a unique JWT ID to avoid duplicate tokens within the same second
      const jti = (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : crypto.randomBytes(16).toString("hex");

      const token = this.app.jwt.sign(
        {
          sub: userId,
          email: userEmail,
          typ: "refresh",
          jti,
        },
        { expiresIn: ttl }
      );

      try {
        await this.prisma.session.create({
          data: { userId, token, expiresAt, userAgent, ipAddress: ip },
        });
        return { token, expiresAt };
      } catch (err: unknown) {
        // Unique constraint on token – try again with a new jti
        if (
          typeof err === "object" &&
          err !== null &&
          (err as any).code === "P2002"
        ) {
          if (attempt === 2) {
            throw err;
          }
          continue;
        }
        throw err;
      }
    }

    // Should never reach here
    throw new Error("Failed to create refresh session");
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

  async oktaExchange(
    idToken: string,
    userAgent?: string,
    ip?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    refreshExpiresAt: Date;
  }> {
    // Decode Auth0 id_token to get user information
    // Note: In production, you should verify the token signature with Auth0's public key

    try {
      // Decode the idToken to get user info
      const parts = idToken.split(".");
      if (parts.length !== 3) {
        throw new UnauthorizedError("Invalid token format");
      }

      /* eslint-disable @typescript-eslint/no-explicit-any */
      let payload: any;
      try {
        // Decode payload (middle part) - handle both regular and base64url encoding
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
        payload = JSON.parse(Buffer.from(padded, "base64").toString());
        
        console.log("Decoded Auth0 token payload:", {
          email: payload.email,
          sub: payload.sub,
          name: payload.name
        });
      } catch (e) {
        console.error("Failed to decode Auth0 token:", e);
        throw new UnauthorizedError("Invalid token encoding");
      }

      // Validate required fields
      if (!payload.email) {
        console.error("No email in Auth0 token:", payload);
        throw new UnauthorizedError("Email is required");
      }

      // Get or create user
      const user = await this.prisma.user.upsert({
        where: { email: payload.email },
        update: {
          lastLoginAt: new Date(),
          // Update name fields if they've changed in Auth0
          firstName: payload.given_name || payload.name?.split(" ")[0] || undefined,
          lastName: payload.family_name || payload.name?.split(" ").slice(1).join(" ") || undefined,
        },
        create: {
          email: payload.email,
          username: `user_${crypto.randomBytes(8).toString('hex')}`,
          firstName: payload.given_name || payload.name?.split(" ")[0] || "",
          lastName: payload.family_name || payload.name?.split(" ").slice(1).join(" ") || "",
          oktaId: payload.sub,
          status: "active",
          // Omit authProvider to avoid DB type mismatches across environments
          emailVerified: true, // Set to true by default to bypass verification
          // Don't set displayName for new users - they'll be prompted to set it up
        },
      });

      // Create tokens
      const accessToken = this.signAccess(user);
      const { token: refreshToken, expiresAt: refreshExpiresAt } =
        await this.createRefreshSession(user.id, user.email, userAgent, ip);

      return { accessToken, refreshToken, refreshExpiresAt };
    } catch (error) {
      console.error("Token exchange error:", error);
      throw new UnauthorizedError("Invalid token");
    }
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
