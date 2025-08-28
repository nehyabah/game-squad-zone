import { Button } from '@/components/ui/button';
import { stripePromise } from '../stripe';
import { useToast } from '@/hooks/use-toast';

interface CheckoutButtonProps {
  amount?: number;
  priceId?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function CheckoutButton({ 
  amount = 1999, // $19.99 in cents
  priceId,
  children = "Pay with Stripe",
  className 
}: CheckoutButtonProps) {
  const { toast } = useToast();

  const handleClick = async () => {
    try {
      // Create a checkout session on the backend
      const res = await fetch('/api/checkout/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: priceId,
          amount: amount,
          currency: 'usd'
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await res.json();

      // Handle response from backend
      if (data.sessionId) {
        const stripe = await stripePromise;
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: data.sessionId });
        }
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Payment Error",
        description: "Backend API not available. Connect to Supabase to enable payments.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button onClick={handleClick} variant="default" className={className}>
      {children}
    </Button>
  );
