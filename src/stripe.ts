import { loadStripe } from '@stripe/stripe-js';

// Note: This will be undefined until you add VITE_STRIPE_PUBLISHABLE_KEY to your environment
export const stripePromise = loadStripe('pk_test_51JqhZtDmKmQ51eGsHgf4ogyKz14xUoHgEM3CmbP6COGtYUaf6LYNwbRjBCSUcrtb8hoD0kzonBtDC9MduSImYefo00htbpvYgE');