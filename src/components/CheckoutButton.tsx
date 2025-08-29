<<<<<<< HEAD
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { stripePromise } from "../stripe";
import { useToast } from "@/hooks/use-toast";
=======
import { Button } from '@/components/ui/button';
import { stripePromise } from '../stripe';
import { useToast } from '@/hooks/use-toast';
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7

interface CheckoutButtonProps {
  amount?: number;
  priceId?: string;
  children?: React.ReactNode;
  className?: string;
}

<<<<<<< HEAD
export default function CheckoutButton({
  amount = 1999, // $19.99 in cents
  priceId,
  children = "Pay with Stripe",
  className,
}: CheckoutButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
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
=======
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
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
        }),
      });

      if (!res.ok) {
<<<<<<< HEAD
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create checkout session");
=======
        throw new Error('Failed to create checkout session');
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
      }

      const data = await res.json();

      // Handle response from backend
      if (data.sessionId) {
        const stripe = await stripePromise;
        if (stripe) {
<<<<<<< HEAD
          const { error } = await stripe.redirectToCheckout({
            sessionId: data.sessionId,
          });
          if (error) {
            throw error;
          }
        } else {
          throw new Error("Stripe not initialized");
=======
          await stripe.redirectToCheckout({ sessionId: data.sessionId });
        } else {
          throw new Error('Stripe not initialized');
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
        }
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
<<<<<<< HEAD
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
=======
      console.error('Checkout error:', error);
      toast({
        title: "Payment Error",
        description: "Backend API not available. Connect to Supabase to enable payments.",
        variant: "destructive"
      });
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
    }
  };

  return (
<<<<<<< HEAD
    <Button
      onClick={handleClick}
      variant="default"
      className={className}
      disabled={isLoading}
    >
      {isLoading ? "Processing..." : children}
=======
    <Button onClick={handleClick} variant="default" className={className}>
      {children}
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
    </Button>
  );
}
