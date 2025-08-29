import { Button } from "@/components/ui/button";
import { stripePromise } from "../stripe";
import { useToast } from "@/hooks/use-toast";

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
  className,
}: CheckoutButtonProps) {
  const { toast } = useToast();

  const handleClick = async () => {
    try {
      // Get API URL from environment variable or use default
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      // Create a checkout session on the backend
      const res = await fetch(`${apiUrl}/api/checkout/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: priceId,
          amount: amount,
          currency: "usd",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const data = await res.json();

      // Handle response from backend
      if (data.sessionId) {
        const stripe = await stripePromise;
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({
            sessionId: data.sessionId,
          });
          if (error) {
            throw error;
          }
        } else {
          throw new Error("Stripe not initialized");
        }
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Payment Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session. Please check that the backend server is running on port 3000.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={handleClick} variant="default" className={className}>
      {children}
    </Button>
  );
}
