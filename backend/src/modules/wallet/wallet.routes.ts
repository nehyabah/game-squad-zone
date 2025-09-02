// src/modules/wallet/wallet.routes.ts
import { FastifyInstance } from "fastify";
import Stripe from "stripe";

export default async function walletRoutes(app: FastifyInstance) {
  // POST /checkout/sessions - Create checkout session for wallet deposits
  app.post("/checkout/sessions", { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const { amount, currency = 'eur' } = req.body as { 
        amount?: number; 
        currency?: string; 
      };

      if (!amount || amount <= 0) {
        return reply.status(400).send({ error: 'Valid amount is required' });
      }

      const userId = req.currentUser!.id;
      
      // Check weekly deposit limit (€50)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyDeposits = await app.prisma.walletTransaction.aggregate({
        where: {
          userId,
          type: 'deposit',
          status: 'completed',
          createdAt: {
            gte: oneWeekAgo
          }
        },
        _sum: {
          amount: true
        }
      });

      const totalWeeklyDeposits = weeklyDeposits._sum.amount || 0;
      const requestedAmount = amount / 100; // Convert cents to euros
      
      if (totalWeeklyDeposits + requestedAmount > 50) {
        const remaining = Math.max(0, 50 - totalWeeklyDeposits);
        return reply.status(400).send({ 
          error: `Weekly deposit limit exceeded. You have €${remaining.toFixed(2)} remaining this week.`,
          weeklyLimit: 50,
          deposited: totalWeeklyDeposits,
          remaining: remaining
        });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return reply.status(503).send({ error: 'Payment processing unavailable' });
      }

      // Initialize Stripe
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });

      const user = await app.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Create Stripe checkout session for wallet deposit
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: "Wallet Deposit",
                description: `Add €${(amount / 100).toFixed(2)} to your Game Squad Zone wallet`,
              },
              unit_amount: amount, // amount in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?wallet=success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?wallet=cancelled`,
        metadata: {
          userId,
          type: "wallet_deposit",
          amount: amount.toString(),
          currency,
        },
        customer_email: user.email,
      });

      // Create wallet transaction record
      await app.prisma.walletTransaction.create({
        data: {
          userId,
          amount: amount / 100, // store in dollars
          currency,
          type: "deposit",
          description: `Wallet deposit via Stripe - €${(amount / 100).toFixed(2)}`,
          stripePaymentId: session.id,
          status: "pending",
        },
      });

      return { sessionId: session.id, url: session.url };
    } catch (error) {
      console.error('Wallet deposit error:', error);
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // GET /wallet/balance - Get user wallet balance
  app.get("/wallet/balance", { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const userId = req.currentUser!.id;
      const user = await app.prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true, walletCurrency: true }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Get weekly deposit info
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyDeposits = await app.prisma.walletTransaction.aggregate({
        where: {
          userId,
          type: 'deposit',
          status: 'completed',
          createdAt: {
            gte: oneWeekAgo
          }
        },
        _sum: {
          amount: true
        }
      });

      const totalWeeklyDeposits = weeklyDeposits._sum.amount || 0;
      const remainingLimit = Math.max(0, 50 - totalWeeklyDeposits);

      return {
        balance: user.walletBalance,
        currency: user.walletCurrency,
        weeklyLimit: {
          limit: 50,
          deposited: totalWeeklyDeposits,
          remaining: remainingLimit
        }
      };
    } catch (error) {
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // POST /wallet/check-payment - Check and process pending payments
  app.post("/wallet/check-payment", { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const { sessionId } = req.body as { sessionId?: string };
      const userId = req.currentUser!.id;

      if (!sessionId) {
        return reply.status(400).send({ error: 'Session ID required' });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return reply.status(503).send({ error: 'Payment processing unavailable' });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });

      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Check if payment was successful
      if (session.payment_status === 'paid' && session.metadata?.type === 'wallet_deposit') {
        // Check if we've already processed this payment
        const existingTransaction = await app.prisma.walletTransaction.findFirst({
          where: {
            stripePaymentId: sessionId,
            status: 'completed'
          }
        });

        if (existingTransaction) {
          // Already processed
          return {
            success: true,
            message: 'Payment already processed',
            balance: (await app.prisma.user.findUnique({
              where: { id: userId },
              select: { walletBalance: true }
            }))?.walletBalance || 0
          };
        }

        const amount = parseFloat(session.metadata.amount) / 100; // Convert cents to euros

        // Update the transaction status
        await app.prisma.walletTransaction.updateMany({
          where: {
            stripePaymentId: sessionId,
            userId: userId,
          },
          data: {
            status: 'completed',
          },
        });

        // Update user's wallet balance
        const updatedUser = await app.prisma.user.update({
          where: { id: userId },
          data: {
            walletBalance: {
              increment: amount,
            },
          },
          select: {
            walletBalance: true,
            walletCurrency: true,
          },
        });


        return {
          success: true,
          message: `Successfully added €${amount.toFixed(2)} to wallet`,
          balance: updatedUser.walletBalance,
          currency: updatedUser.walletCurrency,
        };
      } else if (session.payment_status === 'unpaid') {
        return {
          success: false,
          message: 'Payment not completed yet',
          status: session.payment_status
        };
      } else {
        return {
          success: false,
          message: 'Payment failed or cancelled',
          status: session.payment_status
        };
      }
    } catch (error) {
      console.error('Payment check error:', error);
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // GET /wallet/transactions - Get user wallet transaction history
  app.get("/wallet/transactions", { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const userId = req.currentUser!.id;
      const transactions = await app.prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit to last 50 transactions
      });

      return transactions;
    } catch (error) {
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // DELETE /wallet/clear-all - Clear all wallet data (development only)
  app.delete("/wallet/clear-all", async (req, reply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply.status(403).send({ error: 'Test endpoint not available in production' });
    }

    try {
      // Delete all wallet transactions
      await app.prisma.walletTransaction.deleteMany({});
      
      // Reset all user wallet balances
      await app.prisma.user.updateMany({
        data: {
          walletBalance: 0.0
        }
      });

      // Delete all squad payments
      await app.prisma.squadPayment.deleteMany({});

      return {
        success: true,
        message: 'All wallet data cleared successfully'
      };
    } catch (error) {
      console.error('Error clearing wallet data:', error);
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // POST /wallet/test-complete - Test endpoint to simulate successful payment (development only)
  app.post("/wallet/test-complete", { preHandler: [app.auth] }, async (req, reply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply.status(403).send({ error: 'Test endpoint not available in production' });
    }

    try {
      const { amount = 20 } = req.body as { amount?: number };
      const userId = req.currentUser!.id;

      // Create a completed wallet transaction
      await app.prisma.walletTransaction.create({
        data: {
          userId,
          amount, // amount in euros
          currency: 'eur',
          type: 'deposit',
          description: `Test wallet deposit - €${amount.toFixed(2)}`,
          stripePaymentId: `test_${Date.now()}`,
          status: 'completed',
        },
      });

      // Update user's wallet balance
      const updatedUser = await app.prisma.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            increment: amount,
          },
        },
        select: {
          walletBalance: true,
          walletCurrency: true,
        },
      });

      return {
        success: true,
        message: `Successfully added €${amount.toFixed(2)} to wallet`,
        newBalance: updatedUser.walletBalance,
        currency: updatedUser.walletCurrency,
      };
    } catch (error) {
      console.error('Test wallet deposit error:', error);
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  });

  // POST /stripe/webhook - Handle Stripe webhook events
  app.post("/stripe/webhook", async (req, reply) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return reply.status(503).send({ error: 'Stripe not configured' });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });

      let event: Stripe.Event;

      // In development, we might not have webhook secret configured
      if (webhookSecret) {
        try {
          event = stripe.webhooks.constructEvent(
            req.body as string,
            sig,
            webhookSecret
          );
        } catch (err) {
          console.error('Webhook signature verification failed:', err);
          return reply.status(400).send({ error: 'Invalid webhook signature' });
        }
      } else {
        // For development/testing without webhook secret
        event = req.body as Stripe.Event;
      }

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Check if this is a wallet deposit
          if (session.metadata?.type === 'wallet_deposit') {
            const userId = session.metadata.userId;
            const amount = parseFloat(session.metadata.amount) / 100; // Convert cents to euros
            
            // Update wallet transaction status
            await app.prisma.walletTransaction.updateMany({
              where: {
                stripePaymentId: session.id,
                userId: userId,
              },
              data: {
                status: 'completed',
              },
            });

            // Update user's wallet balance
            await app.prisma.user.update({
              where: { id: userId },
              data: {
                walletBalance: {
                  increment: amount,
                },
              },
            });

              }
          // Check if this is a squad pot payment
          else if (session.metadata?.type === 'squad_pot') {
            const squadId = session.metadata.squadId;
            const userId = session.metadata.userId;
            
            // Update squad payment status
            await app.prisma.squadPayment.updateMany({
              where: {
                stripeSessionId: session.id,
                squadId: squadId,
                userId: userId,
              },
              data: {
                status: 'completed',
                stripePaymentId: session.payment_intent as string,
                paidAt: new Date(),
              },
            });

          }
          break;
        }

        case 'checkout.session.expired':
        case 'checkout.session.async_payment_failed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          if (session.metadata?.type === 'wallet_deposit') {
            // Update wallet transaction status to failed
            await app.prisma.walletTransaction.updateMany({
              where: {
                stripePaymentId: session.id,
              },
              data: {
                status: 'failed',
              },
            });
          } else if (session.metadata?.type === 'squad_pot') {
            // Update squad payment status to failed
            await app.prisma.squadPayment.updateMany({
              where: {
                stripeSessionId: session.id,
              },
              data: {
                status: 'failed',
              },
            });
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Webhook processing error'
      });
    }
  });
}