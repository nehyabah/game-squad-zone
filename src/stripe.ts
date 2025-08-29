import { loadStripe } from '@stripe/stripe-js';

// Load Stripe using the publishable key from the environment
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : null;
