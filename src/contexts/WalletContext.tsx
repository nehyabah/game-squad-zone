import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'refund';
  amount: number;
  description: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  addFunds: (amount: number) => Promise<void>;
  deductFunds: (amount: number, description: string) => boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load wallet data from localStorage when user changes
  useEffect(() => {
    if (user) {
      const walletKey = `squadpot_wallet_${user.id}`;
      const savedWallet = localStorage.getItem(walletKey);
      
      if (savedWallet) {
        const walletData = JSON.parse(savedWallet);
        setBalance(walletData.balance || 0);
        setTransactions(walletData.transactions || []);
      } else {
        // Initialize new wallet
        setBalance(100); // Starting bonus
        const welcomeTransaction: Transaction = {
          id: Date.now().toString(),
          type: 'deposit',
          amount: 100,
          description: 'Welcome bonus',
          timestamp: new Date().toISOString(),
          status: 'completed'
        };
        setTransactions([welcomeTransaction]);
        
        // Save to localStorage
        localStorage.setItem(walletKey, JSON.stringify({
          balance: 100,
          transactions: [welcomeTransaction]
        }));
      }
    } else {
      setBalance(0);
      setTransactions([]);
    }
  }, [user]);

  const saveWalletData = (newBalance: number, newTransactions: Transaction[]) => {
    if (user) {
      const walletKey = `squadpot_wallet_${user.id}`;
      localStorage.setItem(walletKey, JSON.stringify({
        balance: newBalance,
        transactions: newTransactions
      }));
    }
  };

  const addFunds = async (amount: number): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simulate Stripe payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'deposit',
        amount,
        description: `Added funds via Stripe`,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
      const newBalance = balance + amount;
      const newTransactions = [newTransaction, ...transactions];
      
      setBalance(newBalance);
      setTransactions(newTransactions);
      saveWalletData(newBalance, newTransactions);
    } catch (error) {
      console.error('Failed to add funds:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deductFunds = (amount: number, description: string): boolean => {
    if (balance < amount) {
      return false; // Insufficient funds
    }
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'withdrawal',
      amount,
      description,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };
    
    const newBalance = balance - amount;
    const newTransactions = [newTransaction, ...transactions];
    
    setBalance(newBalance);
    setTransactions(newTransactions);
    saveWalletData(newBalance, newTransactions);
    
    return true;
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    let newBalance = balance;
    if (transaction.type === 'deposit' || transaction.type === 'refund') {
      newBalance += transaction.amount;
    } else if (transaction.type === 'withdrawal' || transaction.type === 'bet') {
      newBalance -= transaction.amount;
    }
    
    const newTransactions = [newTransaction, ...transactions];
    
    setBalance(newBalance);
    setTransactions(newTransactions);
    saveWalletData(newBalance, newTransactions);
  };

  return (
    <WalletContext.Provider value={{
      balance,
      transactions,
      addFunds,
      deductFunds,
      addTransaction,
      isLoading
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};