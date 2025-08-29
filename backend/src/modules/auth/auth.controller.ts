import type { FastifyInstance, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";
import { OktaExchangeBody, TokenResponse } from "./auth.schema";
import { Type } from "@sinclair/typebox";

export default async function authController(app: FastifyInstance) {
  const prisma = app.prisma; // assume you decorated prisma on app
  const svc = new AuthService(app, prisma);
  const cookieDomain = process.env.COOKIE_DOMAIN ?? "localhost";
  const isProd = process.env.NODE_ENV === "production";

  // POST /v1/auth/okta/exchange
  app.post(
    "/v1/auth/okta/exchange",
    {
      schema: { body: OktaExchangeBody },
    },
    async (req, reply) => {
      const { idToken } = req.body as { idToken: string };
      const ua = req.headers["user-agent"];
      const ip = (req.headers["x-forwarded-for"] ?? req.ip) as string;

      const { accessToken, refreshToken, refreshExpiresAt } =
        await svc.oktaExchange(idToken, ua, ip);

      // httpOnly refresh cookie
      reply.setCookie("refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        path: "/v1/auth",
        domain: cookieDomain === "localhost" ? undefined : cookieDomain,
        expires: refreshExpiresAt,
      });

      return reply.send({ accessToken, expiresIn: 60 * 15 });
    }
  );

  // POST /v1/auth/refresh
  app.post(
    "/v1/auth/refresh",
    {
      schema: { body: OktaExchangeBody },
    },
    async (req, reply) => {
      const token = req.cookies["refresh_token"];
      const { accessToken } = await svc.refresh(token);
      return reply.send({ accessToken, expiresIn: 60 * 15 });
    }
  );

  // POST /v1/auth/logout
  app.post(
    "/v1/auth/logout",
    {
      schema: { response: { 200: Type.Object({ ok: Type.Boolean() }) } },
    },
    async (req, reply) => {
      const token = req.cookies["refresh_token"];
      await svc.logout(token);
      reply.clearCookie("refresh_token", { path: "/v1/auth" });
      return { ok: true };
    }
  );
}
