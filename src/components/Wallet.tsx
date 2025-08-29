import React, { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CheckoutButton from "./CheckoutButton";
import { 
  Wallet as WalletIcon,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  RefreshCw,
  DollarSign
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Wallet = () => {
  const { balance, transactions } = useWallet();
  const [depositAmount, setDepositAmount] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpCircle className="w-4 h-4 text-green-500" />;
      case 'withdrawal':
      case 'bet':
        return <ArrowDownCircle className="w-4 h-4 text-red-500" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
        return 'text-green-600';
      case 'withdrawal':
      case 'bet':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="text-center pb-2 px-4 md:px-6 pt-4 md:pt-6">
          <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 md:mb-4">
            <WalletIcon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold">
            {formatCurrency(balance)}
          </CardTitle>
          <p className="text-sm md:text-base text-muted-foreground">Available Balance</p>
        </CardHeader>
        <CardContent className="pt-0 px-4 md:px-6 pb-4 md:pb-6">
          <div className="space-y-3 md:space-y-4">
            <div className="space-y-2 md:space-y-3">
              <Input
                type="number"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="5"
                step="0.01"
                className="w-full text-base"
              />
              <CheckoutButton 
                amount={depositAmount ? Math.round(parseFloat(depositAmount) * 100) : 500}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                Pay with Stripe
              </CheckoutButton>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <CreditCard className="w-3 h-3 md:w-4 md:h-4" />
              <span>Powered by Stripe • Minimum $5.00</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader className="px-4 md:px-6 py-3 md:py-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          {transactions.length === 0 ? (
            <div className="text-center py-6 md:py-8 text-muted-foreground">
              <WalletIcon className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-4 opacity-50" />
              <p className="text-sm md:text-base">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-4">
              {transactions.slice(0, 10).map((transaction, index) => (
                <div key={transaction.id}>
                  <div className="flex items-center justify-between py-2 md:py-3">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs md:text-sm truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={`font-semibold text-xs md:text-sm ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <Badge 
                        variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs mt-1"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                  {index < transactions.slice(0, 10).length - 1 && <Separator />}
                </div>
              ))}
              
              {transactions.length > 10 && (
                <div className="text-center pt-2 md:pt-4">
                  <Button variant="outline" size="sm" className="text-xs md:text-sm">
                    View All Transactions
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Wallet;