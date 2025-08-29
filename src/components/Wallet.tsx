import React, { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
<<<<<<< HEAD
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import StripeCardForm from "./StripeCardForm";
import CheckoutButton from "./CheckoutButton";
import {
=======
import CheckoutButton from "./CheckoutButton";
import { 
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
  Wallet as WalletIcon,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  RefreshCw,
<<<<<<< HEAD
  DollarSign,
=======
  DollarSign
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Wallet = () => {
<<<<<<< HEAD
  const { balance, transactions, addFunds, isLoading } = useWallet();
  const [depositAmount, setDepositAmount] = useState("");
  const [showCardForm, setShowCardForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleDepositClick = () => {
    const amount = parseFloat(depositAmount);

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to deposit",
        variant: "destructive",
      });
      return;
    }

    if (amount < 5) {
      toast({
        title: "Minimum Deposit",
        description: "Minimum deposit amount is $5.00",
        variant: "destructive",
      });
      return;
    }

    setShowCardForm(true);
  };

  const handlePaymentSuccess = async () => {
    const amount = parseFloat(depositAmount);
    setShowCardForm(false);

    try {
      await addFunds(amount);
      setDepositAmount("");
    } catch (error) {
      toast({
        title: "Deposit Failed",
        description: "Failed to process your deposit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowUpCircle className="w-4 h-4 text-green-500" />;
      case "withdrawal":
      case "bet":
        return <ArrowDownCircle className="w-4 h-4 text-red-500" />;
      case "refund":
=======
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
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
<<<<<<< HEAD
      case "deposit":
      case "refund":
        return "text-green-600";
      case "withdrawal":
      case "bet":
        return "text-red-600";
      default:
        return "text-gray-600";
=======
      case 'deposit':
      case 'refund':
        return 'text-green-600';
      case 'withdrawal':
      case 'bet':
        return 'text-red-600';
      default:
        return 'text-gray-600';
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
    }
  };

  return (
<<<<<<< HEAD
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <WalletIcon className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">
            {formatCurrency(balance)}
          </CardTitle>
          <p className="text-muted-foreground">Available Balance</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="space-y-3">
=======
    <div className="space-y-4 md:space-y-6">
      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="text-center pb-2 px-4 md:px-6 pt-4 md:pt-5">
          <div className="mx-auto w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-full flex items-center justify-center mb-2 md:mb-3">
            <WalletIcon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl md:text-2xl font-bold">
            {formatCurrency(balance)}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Available Balance</p>
        </CardHeader>
        <CardContent className="pt-0 px-4 md:px-6 pb-4 md:pb-5">
          <div className="space-y-3">
            <div className="space-y-2 md:space-y-3">
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
              <Input
                type="number"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="5"
                step="0.01"
<<<<<<< HEAD
                className="w-full"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleDepositClick}
                  disabled={
                    isLoading || !depositAmount || parseFloat(depositAmount) < 5
                  }
                  variant="outline"
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Mock Payment
                </Button>
                <CheckoutButton
                  amount={
                    depositAmount
                      ? Math.round(parseFloat(depositAmount) * 100)
                      : 500
                  }
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Real Stripe
                </CheckoutButton>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="w-4 h-4" />
=======
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
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <CreditCard className="w-3 h-3" />
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
              <span>Powered by Stripe • Minimum $5.00</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
<<<<<<< HEAD
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <WalletIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 10).map((transaction, index) => (
                <div key={transaction.id}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(transaction.timestamp),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold text-sm ${getTransactionColor(
                          transaction.type
                        )}`}
                      >
                        {transaction.type === "deposit" ||
                        transaction.type === "refund"
                          ? "+"
                          : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <Badge
                        variant={
                          transaction.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
=======
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
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
<<<<<<< HEAD
                  {index < transactions.slice(0, 10).length - 1 && (
                    <Separator />
                  )}
                </div>
              ))}

              {transactions.length > 10 && (
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm">
=======
                  {index < transactions.slice(0, 10).length - 1 && <Separator />}
                </div>
              ))}
              
              {transactions.length > 10 && (
                <div className="text-center pt-2 md:pt-4">
                  <Button variant="outline" size="sm" className="text-xs md:text-sm">
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
                    View All Transactions
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
<<<<<<< HEAD

      {/* Stripe Card Form Dialog */}
      <Dialog open={showCardForm} onOpenChange={setShowCardForm}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <StripeCardForm
            amount={parseFloat(depositAmount) || 0}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowCardForm(false)}
          />
        </DialogContent>
      </Dialog>
=======
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
    </div>
  );
};

<<<<<<< HEAD
export default Wallet;
=======
export default Wallet;
>>>>>>> 53aba1c646428e018703f884f0218645e12deab7
