import { useState } from "react";
import { Button } from "@/components/ui/button";
import { stripePromise } from "../stripe";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api/auth";

interface CheckoutButtonProps {
  amount?: number;
  priceId?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function CheckoutButton({
  amount = 1999, // $19.99 in cents
  priceId,
  children = "Pay with Stripe",
  className,
  disabled = false,
}: CheckoutButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);

      // Check authentication
      if (!authAPI.isAuthenticated()) {
        toast({
          title: "Authentication Required",
          description: "Please log in to make a payment.",
          variant: "destructive",
        });
        return;
      }

      // Get API URL from environment variable or use default
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

      // Create a checkout session on the backend
      const res = await fetch(`${apiUrl}/api/checkout/sessions`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${authAPI.getToken()}`,
        },
        body: JSON.stringify({
          amount: amount,
          currency: "eur",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const data = await res.json();

      // Handle response from backend
      if (data.sessionId) {
        // Store session ID for payment verification
        localStorage.setItem('stripeSessionId', data.sessionId);
        
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
        // Extract session ID from URL if available
        const urlMatch = data.url.match(/cs_[a-zA-Z0-9]+/);
        if (urlMatch) {
          localStorage.setItem('stripeSessionId', urlMatch[0]);
        }
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="default"
      className={className}
      disabled={disabled || isLoading}
    >
      {isLoading ? "Processing..." : children}
    </Button>
  );
}
