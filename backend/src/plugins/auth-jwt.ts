import fp from "fastify-plugin";
import fjwt from "@fastify/jwt";
import type { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    auth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    currentUser?: { id: string; email: string; emailVerified: boolean }; // Changed from 'user' to 'currentUser'
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
      
      // Check user's email verification status in database
      const user = await app.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, emailVerified: true, status: true }
      });

      if (!user) {
        return reply.code(401).send({ error: "User not found" });
      }

      if (!user.emailVerified) {
        return reply.code(401).send({ 
          error: "Email verification required",
          message: "Please verify your email address to access the platform. Check your email for verification instructions."
        });
      }

      if (user.status !== 'active') {
        return reply.code(401).send({ error: "Account is not active" });
      }

      req.currentUser = { 
        id: user.id, 
        email: user.email, 
        emailVerified: user.emailVerified 
      };
    } catch (error) {
      return reply.code(401).send({ error: "Invalid access token" });
    }
  });
});
