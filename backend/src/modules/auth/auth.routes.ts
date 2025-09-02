// src/modules/auth/auth.routes.ts
import { FastifyInstance, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";

export default async function authRoutes(app: FastifyInstance) {
  // Initialize AuthService if it exists
  let svc: AuthService | null = null;

  try {
    svc = new AuthService(app, app.prisma);
  } catch (error) {
    console.error("AuthService initialization failed:", error);
  }



  // GET /login - get Auth0 login URL (OAuth)
  app.get("/login", async (req, reply) => {
    const domain = process.env.OKTA_DOMAIN;
    const clientId = process.env.OKTA_CLIENT_ID;
    const redirectUri = process.env.OKTA_REDIRECT_URI;

    if (!domain || !clientId) {
      return reply.status(500).send({
        error: "Auth0 configuration missing",
        domain: !!domain,
        clientId: !!clientId,
      });
    }

    const authUrl =
      `https://${domain}/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri!)}&` +
      `scope=openid profile email`;

    return { authUrl };
  });

  // GET /callback - OAuth callback handler
  app.get("/callback", async (req, reply) => {
    const { code, error } = req.query as { code?: string; error?: string };

    if (error) {
      return reply.status(400).send({ error });
    }

    if (!code) {
      return reply
        .status(400)
        .send({ error: "No authorization code received" });
    }

    // Exchange the code for tokens with Auth0
    const domain = process.env.OKTA_DOMAIN;
    const clientId = process.env.OKTA_CLIENT_ID;
    const clientSecret = process.env.OKTA_CLIENT_SECRET;
    const redirectUri = process.env.OKTA_REDIRECT_URI;

    try {
      const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        return reply.status(400).send({
          error: tokens.error,
          error_description: tokens.error_description,
        });
      }

      // Always redirect to frontend - never show JSON to users
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
      
      // If we have AuthService, try to create a session
      if (svc && tokens.id_token) {
        try {
          const { accessToken, refreshToken, refreshExpiresAt } =
            await svc.oktaExchange(
              tokens.id_token,
              req.headers["user-agent"],
              req.ip
            );

          // Set refresh token cookie
          reply.setCookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            expires: refreshExpiresAt,
          });

          // Redirect to frontend with access token
          return reply.redirect(`${frontendUrl}/auth/success?token=${accessToken}`);
        } catch (err) {
          console.error("Session creation failed:", err);
          // Even if session creation fails, redirect with the id_token
          return reply.redirect(`${frontendUrl}/auth/success?id_token=${tokens.id_token}`);
        }
      }

      // If no AuthService or no id_token, redirect with id_token if available
      if (tokens.id_token) {
        return reply.redirect(`${frontendUrl}/auth/success?id_token=${tokens.id_token}`);
      }

      // Last resort: redirect to login with error
      return reply.redirect(`${frontendUrl}/login?error=authentication_failed`);
    } catch (err) {
      console.error("Token exchange failed:", err);
      return reply
        .status(500)
        .send({ error: "Failed to exchange code for tokens" });
    }
  });

  // POST /okta/exchange - Exchange Auth0 ID token for session
  app.post("/okta/exchange", async (req, reply) => {
    if (!svc) {
      return reply.status(500).send({ error: "AuthService not available" });
    }

    const { idToken } = req.body as { idToken: string };

    if (!idToken) {
      return reply.status(400).send({ error: "ID token required" });
    }

    try {
      const ua = req.headers["user-agent"];
      const ip = (req.headers["x-forwarded-for"] ?? req.ip) as string;

      const { accessToken, refreshToken, refreshExpiresAt } =
        await svc.oktaExchange(idToken, ua, ip);

      // Set refresh token cookie
      reply.setCookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: refreshExpiresAt,
      });

      return { accessToken, expiresIn: 60 * 15 }; // 15 minutes
    } catch (error) {
      console.error("Token exchange error:", error);
      return reply.status(401).send({
        error: "Invalid token",
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  // POST /refresh - Refresh access token
  app.post("/refresh", async (req, reply) => {
    if (!svc) {
      return reply.status(500).send({ error: "AuthService not available" });
    }

    const token = req.cookies["refresh_token"];
    if (!token) {
      return reply.status(401).send({ error: "Refresh token required" });
    }

    try {
      const { accessToken } = await svc.refresh(token);
      return { accessToken, expiresIn: 60 * 15 };
    } catch (error) {
      return reply.status(401).send({ error: "Invalid refresh token" });
    }
  });

  // POST /logout - Logout user
  app.post("/logout", async (req, reply) => {
    if (!svc) {
      return reply.status(500).send({ error: "AuthService not available" });
    }

    const token = req.cookies["refresh_token"];
    await svc.logout(token);
    reply.clearCookie("refresh_token");
    return { success: true };
  });

  // GET /me - Get current user (protected route)
  app.get("/me", { preHandler: [app.auth] }, async (req, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: req.currentUser!.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    return user;
  });

  // PUT /me - Update current user profile (protected route)
  app.put("/me", { preHandler: [app.auth] }, async (req: FastifyRequest, reply) => {
    const { firstName, lastName, username, avatarUrl, displayName } = req.body as {
      firstName?: string;
      lastName?: string;
      username?: string;
      avatarUrl?: string;
      displayName?: string;
    };

    try {
      // Check if username is already taken (if provided)
      if (username) {
        const existingUser = await app.prisma.user.findFirst({
          where: { 
            username, 
            NOT: { id: req.currentUser!.id }
          }
        });
        
        if (existingUser) {
          return reply.status(400).send({ error: "Username already taken" });
        }
      }

      const updateData = {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(username !== undefined && { username }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(displayName !== undefined && { displayName }),
      };
      

      const user = await app.prisma.user.update({
        where: { id: req.currentUser!.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      });

      return user;
    } catch (error) {
      return reply.status(500).send({ error: "Failed to update profile" });
    }
  });

  // DELETE /me - Delete current user account (protected route)
  app.delete("/me", { preHandler: [app.auth] }, async (req: FastifyRequest, reply) => {
    const userId = req.currentUser!.id;
    
    try {
      // Start a transaction to delete all user-related data
      await app.prisma.$transaction(async (prisma) => {
        // Delete squad messages
        await prisma.squadMessage.deleteMany({
          where: { userId }
        });

        // Delete user picks
        await prisma.pick.deleteMany({
          where: { 
            pickSet: { userId }
          }
        });

        // Delete pick sets
        await prisma.pickSet.deleteMany({
          where: { userId }
        });

        // Delete squad payments
        await prisma.squadPayment.deleteMany({
          where: { userId }
        });

        // Delete wallet transactions
        await prisma.walletTransaction.deleteMany({
          where: { userId }
        });

        // Remove user from squad memberships
        await prisma.squadMember.deleteMany({
          where: { userId }
        });

        // Delete squads owned by the user (this will cascade to other related data)
        await prisma.squad.deleteMany({
          where: { ownerId: userId }
        });

        // Delete user sessions
        await prisma.session.deleteMany({
          where: { userId }
        });

        // Finally, delete the user
        await prisma.user.delete({
          where: { id: userId }
        });
      });

      // If we have AuthService, logout the user to clean up any remaining sessions
      if (svc) {
        try {
          const token = req.cookies["refresh_token"];
          await svc.logout(token);
          reply.clearCookie("refresh_token");
        } catch (error) {
          // Log but don't fail the request if logout fails
          console.warn("Failed to logout during account deletion:", error);
        }
      }

      return { message: "Account successfully deleted" };
    } catch (error) {
      console.error("Account deletion failed:", error);
      return reply.status(500).send({ error: "Failed to delete account" });
    }
  });

  // GET /me/squads - Get current user's squads (protected route)
  app.get("/me/squads", { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const squads = await app.prisma.squad.findMany({
        where: {
          members: {
            some: { userId: req.currentUser!.id }
          }
        },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              displayName: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                }
              }
            }
          },
          _count: {
            select: {
              members: true,
              payments: true,
            }
          }
        }
      });

      return squads;
    } catch (error) {
      return reply.status(500).send({ error: "Failed to fetch squads" });
    }
  });

  // GET /me/stats - Get user statistics (protected route)
  app.get("/me/stats", { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const userId = req.currentUser!.id;

      const [ownedSquadsCount, memberSquadsCount, totalPayments] = await Promise.all([
        app.prisma.squad.count({ where: { ownerId: userId } }),
        app.prisma.squadMember.count({ where: { userId } }),
        app.prisma.squadPayment.aggregate({
          where: { userId, status: 'completed' },
          _sum: { amount: true },
          _count: true,
        })
      ]);

      return {
        squads: {
          owned: ownedSquadsCount,
          member: memberSquadsCount,
          total: memberSquadsCount,
        },
        payments: {
          count: totalPayments._count,
          totalAmount: (totalPayments._sum.amount || 0) / 100, // Convert cents to dollars
        }
      };
    } catch (error) {
      return reply.status(500).send({ error: "Failed to fetch stats" });
    }
  });

  // POST /resend-verification - Trigger email verification resend
  app.post("/resend-verification", async (req, reply) => {
    const { email } = req.body as { email: string };
    
    if (!email) {
      return reply.status(400).send({ error: "Email is required" });
    }

    // In a real implementation, you would call Auth0 Management API to resend verification
    // For now, return instructions for the user
    return reply.send({
      message: "If an account with this email exists, we've sent verification instructions.",
      instructions: [
        "Check your email inbox and spam folder",
        "Click the verification link in the email from Auth0",
        "Return to the platform and log in again",
        "If you don't receive an email, contact support"
      ]
    });
  });

  // GET /test - Simple test endpoint
  app.get("/test", async (req, reply) => {
    return { message: "Auth routes are working!" };
  });

  app.get("/debug/users", async (req, reply) => {
    const users = await app.prisma.user.findMany({
      select: {
        id: true,
        oktaId: true,
        email: true,
        username: true,
      }
    });
    return users;
  });

  app.delete("/debug/test-picks", async (req, reply) => {
    const deleted = await app.prisma.pickSet.deleteMany({
      where: {
        userId: "test-user-123"
      }
    });
    return { message: `Deleted ${deleted.count} test pick sets` };
  });

  app.get("/debug/picks", async (req, reply) => {
    const pickSets = await app.prisma.pickSet.findMany({
      select: {
        id: true,
        userId: true,
        weekId: true,
        status: true,
        picks: true,
      }
    });
    return pickSets;
  });
}
