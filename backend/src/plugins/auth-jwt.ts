import fp from "fastify-plugin";
import fjwt from "@fastify/jwt";
import type { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    auth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    currentUser?: { id: string; email: string }; // Changed from 'user' to 'currentUser'
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      typ?: string;
    };
  }
}

export default fp(async (app) => {
  app.register(fjwt, {
    secret: process.env.JWT_SECRET!,
    cookie: { cookieName: "access_token", signed: false },
  });

  app.decorate("auth", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = req.headers.authorization?.split(" ")[1] ?? undefined;
      if (!token) {
        return reply.code(401).send({ error: "Missing access token" });
      }

      const payload = app.jwt.verify<{ sub: string; email: string }>(token);
      req.currentUser = { id: payload.sub, email: payload.email }; // Use currentUser instead
    } catch (error) {
      return reply.code(401).send({ error: "Invalid access token" });
    }
  });
});
