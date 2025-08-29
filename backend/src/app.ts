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

  // Log that we're registering CORS
  console.log("Registering CORS plugin...");

  // Register CORS - Allow all origins for debugging
  app.register(fastifyCors, {
    origin: true, // Allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Content-Type"],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Add a hook to log CORS headers
  app.addHook("onRequest", async (request, reply) => {
    console.log(
      `Incoming ${request.method} request to ${request.url} from origin: ${request.headers.origin}`
    );
  });

  app.addHook("onSend", async (request, reply, payload) => {
    console.log("Response headers:", reply.getHeaders());
    return payload;
  });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn("WARNING: STRIPE_SECRET_KEY is not set - using test mode");
    // Use a dummy key for testing
  }

  const stripe = secretKey
    ? new Stripe(secretKey, { apiVersion: "2023-10-16" })
    : null;

  // Health check endpoint
  app.get("/health", async (request, reply) => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Test CORS endpoint
  app.options("/api/checkout/sessions", async (request, reply) => {
    console.log("OPTIONS request received for /api/checkout/sessions");
    reply.status(204).send();
  });

  // Stripe checkout session endpoint
  app.post("/api/checkout/sessions", async (request, reply) => {
    console.log("POST request to /api/checkout/sessions");
    console.log("Request body:", request.body);

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

      // If no Stripe key, return a mock response for testing
      if (!stripe) {
        console.log("No Stripe key - returning mock session");
        return reply.send({
          sessionId: "mock_session_" + Date.now(),
          message:
            "Mock session - configure STRIPE_SECRET_KEY to use real Stripe",
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
      console.error("Error in checkout session:", error);
      request.log.error(error);
      reply.status(500).send({ error: "Failed to create checkout session" });
    }
  });

  return app;
}
