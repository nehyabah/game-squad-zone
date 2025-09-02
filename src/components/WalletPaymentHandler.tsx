import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authAPI } from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function WalletPaymentHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkPayment = async () => {
      const walletStatus = searchParams.get('wallet');
      const sessionId = localStorage.getItem('stripeSessionId');

      if (walletStatus === 'success' && sessionId) {
        setChecking(true);
        
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const token = authAPI.getToken();

          if (!token) {
            toast({
              title: 'Authentication Required',
              description: 'Please log in to complete your payment.',
              variant: 'destructive',
            });
            return;
          }

          // Check payment status with backend
          const response = await fetch(`${apiUrl}/api/wallet/check-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ sessionId }),
          });

          const data = await response.json();

          if (data.success) {
            toast({
              title: 'Payment Successful! 🎉',
              description: data.message,
            });
            
            // Clear the session ID
            localStorage.removeItem('stripeSessionId');
            
            // Remove the query parameter
            searchParams.delete('wallet');
            setSearchParams(searchParams);
            
            // Trigger a refresh of user data
            window.dispatchEvent(new Event('walletUpdated'));
          } else if (data.message === 'Payment not completed yet') {
            // Retry after a delay
            setTimeout(() => checkPayment(), 2000);
          } else {
            toast({
              title: 'Payment Status',
              description: data.message || 'Payment processing...',
              variant: 'default',
            });
            
            // Clear the session ID
            localStorage.removeItem('stripeSessionId');
            
            // Remove the query parameter
            searchParams.delete('wallet');
            setSearchParams(searchParams);
          }
        } catch (error) {
          console.error('Error checking payment:', error);
          toast({
            title: 'Error',
            description: 'Failed to verify payment. Please check your wallet balance.',
            variant: 'destructive',
          });
        } finally {
          setChecking(false);
        }
      } else if (walletStatus === 'cancelled') {
        toast({
          title: 'Payment Cancelled',
          description: 'Your payment was cancelled.',
          variant: 'default',
        });
        
        // Clear the session ID
        localStorage.removeItem('stripeSessionId');
        
        // Remove the query parameter
        searchParams.delete('wallet');
        setSearchParams(searchParams);
      }
    };

    checkPayment();
  }, [searchParams, setSearchParams, toast]);

  if (checking) {
    return (
      <div className="fixed top-20 right-4 bg-white shadow-lg rounded-lg p-4 flex items-center space-x-3 z-50">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Processing your payment...</span>
      </div>
    );
  }

  return null;
}