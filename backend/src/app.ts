import Fastify, { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import process from 'node:process';

/**
 * Build and configure the Fastify instance.
 */
export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true // Enable logging for better debugging
  });

  // Get Stripe secret key from environment
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }

  // Initialize Stripe
  const stripe = new Stripe(secretKey, { 
    apiVersion: '2023-10-16' // Updated to latest API version
  });

  // Get the base URL from environment or use default
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';

  // Enable CORS for frontend requests
  app.register(require('@fastify/cors'), {
    origin: [baseUrl, 'http://localhost:3000', 'http://localhost:8080'],
    credentials: true
  });

  // Register JSON schema validation
  app.register(require('@fastify/type-provider-typebox'));

  // Checkout session creation endpoint
  app.post('/api/checkout/sessions', async (request, reply) => {
    try {
      const body = request.body as {
        amount?: number;
        priceId?: string;
        currency?: string;
        successUrl?: string;
        cancelUrl?: string;
      };

      // Use custom URLs if provided, otherwise use defaults
      const successUrl = body.successUrl || `${baseUrl}/success`;
      const cancelUrl = body.cancelUrl || `${baseUrl}/cancel`;

      let sessionConfig: Stripe.Checkout.SessionCreateParams;

      if (body.priceId) {
        // Use existing price ID
        sessionConfig = {
          mode: 'payment',
          line_items: [{ 
            price: body.priceId, 
            quantity: 1 
          }],
          success_url: successUrl,
          cancel_url: cancelUrl,
        };
      } else {
        // Create price dynamically
        sessionConfig = {
          mode: 'payment',
          line_items: [
            {
              price_data: {
                currency: body.currency ?? 'usd',
                product_data: { 
                  name: 'Game Squad Purchase',
                  description: 'Purchase from Game Squad'
                },
                unit_amount: body.amount ?? 0,
              },
              quantity: 1,
            },
          ],
          success_url: successUrl,
          cancel_url: cancelUrl,
        };
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      reply.send({ 
        sessionId: session.id,
        url: session.url
      });
    } catch (error) {
      app.log.error('Error creating checkout session:', error);
      reply.status(500).send({ 
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Webhook endpoint for Stripe events (optional but recommended)
  app.post('/api/webhooks/stripe', async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      app.log.warn('STRIPE_WEBHOOK_SECRET not set, skipping webhook verification');
      reply.status(400).send({ error: 'Webhook secret not configured' });
      return;
    }

    try {
      const event = stripe.webhooks.constructEvent(
        request.body as string,
        sig,
        webhookSecret
      );

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          app.log.info(`Payment successful for session: ${session.id}`);
          // Add your business logic here
          break;
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          app.log.info(`Payment succeeded: ${paymentIntent.id}`);
          // Add your business logic here
          break;
        default:
          app.log.info(`Unhandled event type: ${event.type}`);
      }

      reply.send({ received: true });
    } catch (error) {
      app.log.error('Webhook error:', error);
      reply.status(400).send({ 
        error: 'Webhook error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Health check endpoint
  app.get('/health', async (request, reply) => {
    reply.send({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  return app;
}