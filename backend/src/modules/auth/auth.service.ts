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

  async oktaExchange(idToken: string, userAgent?: string, ip?: string): Promise<{ accessToken: string; refreshToken: string; refreshExpiresAt: Date }> {
    // For development, create a basic token exchange without full Okta verification
    // In production, you should verify the idToken with Okta properly
    
    try {
      // Decode the idToken to get user info (basic decode without verification for dev)
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedError("Invalid token format");
      }
      
      let payload: any;
      try {
        // Decode payload (middle part)
        payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      } catch (e) {
        // If decode fails, create a test user for development
        payload = {
          email: 'dev@example.com',
          sub: `dev-${Date.now()}`,
          preferred_username: 'devuser'
        };
      }
      
      // Get or create user
      const user = await this.prisma.user.upsert({
        where: { email: payload.email || 'dev@example.com' },
        update: {
          lastLoginAt: new Date(),
        },
        create: {
          email: payload.email || 'dev@example.com',
          username: payload.preferred_username || payload.email?.split('@')[0] || 'devuser',
          firstName: payload.given_name || 'Dev',
          lastName: payload.family_name || 'User',
          oktaId: payload.sub || `dev-${Date.now()}`,
          status: 'active',
          authProvider: 'okta',
          emailVerified: true,
        },
      });
      
      // Create tokens
      const accessToken = this.signAccess(user);
      const { token: refreshToken, expiresAt: refreshExpiresAt } = 
        await this.createRefreshSession(user.id, user.email, userAgent, ip);
      
      return { accessToken, refreshToken, refreshExpiresAt };
    } catch (error) {
      console.error('Token exchange error:', error);
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
