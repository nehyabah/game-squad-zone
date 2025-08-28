import { loadStripe } from '@stripe/stripe-js';

// Load Stripe using the publishable key from the environment
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!
);
