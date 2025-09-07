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
        console.error('[Auth] No token in Authorization header');
        return reply.code(401).send({ error: "Missing access token" });
      }

      console.log('[Auth] Verifying token for request to:', req.url);
      const payload = app.jwt.verify<{ sub: string; email: string }>(token);
      console.log('[Auth] Token verified, user ID:', payload.sub);
      
      // Check user's email verification status in database
      const user = await app.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, emailVerified: true, status: true }
      });

      if (!user) {
        console.error('[Auth] User not found in database:', payload.sub);
        return reply.code(401).send({ error: "User not found" });
      }
      console.log('[Auth] User found:', user.email);

      // Email verification is disabled - users have immediate access after login
      // Uncomment the following block if you want to re-enable email verification
      /*
      const requireEmailVerification = (process.env.REQUIRE_EMAIL_VERIFICATION ?? 'true').toLowerCase() !== 'false';
      if (requireEmailVerification && !user.emailVerified) {
        return reply.code(401).send({ 
          error: "Email verification required",
          message: "Please verify your email address to access the platform. Check your email for verification instructions."
        });
      }
      */

      if (user.status !== 'active') {
        return reply.code(401).send({ error: "Account is not active" });
      }

      req.currentUser = { 
        id: user.id, 
        email: user.email, 
        emailVerified: user.emailVerified 
      };
    } catch (error) {
      console.error('[Auth] Token verification failed:', error);
      return reply.code(401).send({ error: "Invalid access token", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
});
