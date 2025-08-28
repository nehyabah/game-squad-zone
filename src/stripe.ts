import { loadStripe } from '@stripe/stripe-js';

// Load Stripe using the publishable key from the environment
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('Stripe publishable key is missing. Please set VITE_STRIPE_PUBLISHABLE_KEY in your environment variables.');
}

export const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : null;