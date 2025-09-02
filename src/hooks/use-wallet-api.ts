import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: string;
  description: string;
  stripePaymentId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface WeeklyLimit {
  limit: number;
  deposited: number;
  remaining: number;
}

interface WalletData {
  balance: number;
  currency: string;
  transactions: Transaction[];
  weeklyLimit?: WeeklyLimit;
}

export function useWalletAPI() {
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    currency: 'eur',
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWalletData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = authAPI.getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch balance
      const balanceResponse = await fetch(`${apiUrl}/api/wallet/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Check for authentication errors
      if (balanceResponse.status === 401) {
        localStorage.removeItem('authToken');
        setLoading(false);
        return;
      }

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        
        // Fetch transactions
        const transactionsResponse = await fetch(`${apiUrl}/api/wallet/transactions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Check for authentication errors on transactions
        if (transactionsResponse.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/';
          return;
        }

        let transactions: Transaction[] = [];
        if (transactionsResponse.ok) {
          transactions = await transactionsResponse.json();
        }

        setWalletData({
          balance: balanceData.balance || 0,
          currency: balanceData.currency || 'eur',
          transactions: transactions,
          weeklyLimit: balanceData.weeklyLimit
        });
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();

    // Listen for wallet updates
    const handleWalletUpdate = () => {
      fetchWalletData();
    };

    window.addEventListener('walletUpdated', handleWalletUpdate);
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchWalletData, 30000);

    return () => {
      window.removeEventListener('walletUpdated', handleWalletUpdate);
      clearInterval(interval);
    };
  }, []);

  const refresh = () => {
    fetchWalletData();
  };

  return {
    balance: walletData.balance,
    currency: walletData.currency,
    transactions: walletData.transactions,
    weeklyLimit: walletData.weeklyLimit,
    loading,
    refresh
  };
}