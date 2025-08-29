// src/modules/auth/auth.routes.ts
import { FastifyInstance } from "fastify";
import { AuthService } from "./auth.service";

export default async function authRoutes(app: FastifyInstance) {
  // Initialize AuthService if it exists
  let svc: AuthService | null = null;

  try {
    svc = new AuthService(app, app.prisma);
  } catch (error) {
    console.error("AuthService initialization failed:", error);
  }

  // GET /login - get Auth0 login URL
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

      // If we have AuthService, use it to create a session
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
          const frontendUrl =
            process.env.FRONTEND_URL || "http://localhost:8080";
          return reply.redirect(
            `${frontendUrl}/auth/success?token=${accessToken}`
          );
        } catch (err) {
          console.error("Session creation failed:", err);
        }
      }

      // Fallback: just return the tokens for testing
      return {
        message: "Authentication successful",
        tokens,
        next_step: "Use id_token with /okta/exchange endpoint",
      };
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
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    return user;
  });

  // GET /test - Simple test endpoint
  app.get("/test", async (req, reply) => {
    return { message: "Auth routes are working!" };
  });
}
