import Fastify, { FastifyInstance } from "fastify";
import Stripe from "stripe";
import process from "node:process";
import fastifyCors from "@fastify/cors";
import "dotenv/config";

/**
 * Build and configure the Fastify instance.
 */
export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
    disableRequestLogging: false,
  });

  // Simple CORS setup - allows all origins in development
  if (process.env.NODE_ENV === "production") {
    // Production: strict CORS
    app.register(fastifyCors, {
      origin: ["https://yourdomain.com"], // Replace with your production domain
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    });
  } else {
    // Development: allow all origins
    app.register(fastifyCors, {
      origin: true, // Allow all origins
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

  // Health check endpoint
  app.get("/health", async (request, reply) => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Stripe checkout session endpoint
  app.post("/api/checkout/sessions", async (request, reply) => {
    try {
      const body = request.body as {
        amount?: number;
        priceId?: string;
        currency?: string;
      };

      // Validate input
      if (!body.priceId && !body.amount) {
        return reply.status(400).send({
          error: "Either priceId or amount must be provided",
        });
      }

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";

      const session = await stripe.checkout.sessions.create(
        body.priceId
          ? {
              mode: "payment",
              line_items: [{ price: body.priceId, quantity: 1 }],
              success_url: `${frontendUrl}/success`,
              cancel_url: `${frontendUrl}/cancel`,
            }
          : {
              mode: "payment",
              line_items: [
                {
                  price_data: {
                    currency: body.currency ?? "usd",
                    product_data: { name: "Game Squad Purchase" },
                    unit_amount: body.amount ?? 0,
                  },
                  quantity: 1,
                },
              ],
              success_url: `${frontendUrl}/success`,
              cancel_url: `${frontendUrl}/cancel`,
            }
      );

      reply.send({ sessionId: session.id });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: "Failed to create checkout session" });
    }
  });

  return app;
}
