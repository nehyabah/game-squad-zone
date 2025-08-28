import Fastify, { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import process from 'node:process';

/**
 * Build and configure the Fastify instance.
 */
export function buildApp(): FastifyInstance {
  const app = Fastify();

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });

  app.post('/api/checkout/sessions', async (request, reply) => {
    const body = request.body as {
      amount?: number;
      priceId?: string;
      currency?: string;
    };

    const session = await stripe.checkout.sessions.create(
      body.priceId
        ? {
            mode: 'payment',
            line_items: [{ price: body.priceId, quantity: 1 }],
            success_url: 'http://localhost:8080/success',
            cancel_url: 'http://localhost:8080/cancel',
          }
        : {
            mode: 'payment',
            line_items: [
              {
                price_data: {
                  currency: body.currency ?? 'usd',
                  product_data: { name: 'Game Squad Purchase' },
                  unit_amount: body.amount ?? 0,
                },
                quantity: 1,
              },
            ],
            success_url: 'http://localhost:8080/success',
            cancel_url: 'http://localhost:8080/cancel',
          }
    );

    reply.send({ sessionId: session.id });
  });

  return app;
}

