import React, { useState } from "react";
import { useWalletAPI } from "@/hooks/use-wallet-api";
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
  DollarSign,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Wallet = () => {
  const { balance, transactions, weeklyLimit, loading, refresh } = useWalletAPI();
  const [depositAmount, setDepositAmount] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-EU", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getTransactionIcon = (type: string, status: string) => {
    // Different colors based on status
    const iconClasses = status === "failed" || status === "cancelled" || status === "expired" 
      ? "w-4 h-4 text-red-400" 
      : status === "pending" 
      ? "w-4 h-4 text-amber-500" 
      : "w-4 h-4";

    switch (type) {
      case "deposit":
        return <ArrowUpCircle className={`${iconClasses} ${status === "completed" ? "text-green-500" : ""}`} />;
      case "withdrawal":
        return <ArrowDownCircle className={`${iconClasses} ${status === "completed" ? "text-red-500" : ""}`} />;
      case "bet":
      case "squad_payment":
        return <ArrowDownCircle className={`${iconClasses} ${status === "completed" ? "text-red-500" : ""}`} />;
      case "refund":
        return <RefreshCw className={`${iconClasses} ${status === "completed" ? "text-blue-500" : ""}`} />;
      default:
        return <DollarSign className={`${iconClasses} text-gray-500`} />;
    }
  };

  const getTransactionColor = (type: string, status: string) => {
    // Override color based on status
    if (status === "failed" || status === "cancelled" || status === "expired") {
      return "text-red-500";
    }
    if (status === "pending") {
      return "text-amber-600";
    }

    // Default colors for completed transactions
    switch (type) {
      case "deposit":
      case "refund":
        return "text-green-600";
      case "withdrawal":
      case "bet":
      case "squad_payment":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
      case "cancelled":
      case "expired":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case "cancelled":
      case "expired":
        return "cancelled";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20">
      {/* Wallet Balance Card - Clean gradient design */}
      <Card className="relative overflow-hidden border border-primary/10 shadow-lg bg-gradient-to-br from-background via-primary/5 to-background backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-60"></div>
        <CardContent className="relative p-3">
          {/* Balance Section */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center shadow-md border border-primary/20">
                  <WalletIcon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refresh}
                className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/5 transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Weekly Limit - Compact design */}
          {weeklyLimit && (
            <div className="bg-gradient-to-r from-background/80 to-primary/5 rounded-lg p-2.5 mb-3 border border-primary/10 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">Weekly Limit</span>
                <span className="text-xs font-semibold text-foreground">
                  {formatCurrency(weeklyLimit.deposited)} / {formatCurrency(weeklyLimit.limit)}
                </span>
              </div>
              <div className="w-full bg-muted/60 rounded-full h-1.5 mb-1.5">
                <div 
                  className="bg-gradient-to-r from-primary to-primary/80 h-1.5 rounded-full transition-all duration-300 shadow-sm" 
                  style={{ width: `${Math.min((weeklyLimit.deposited / weeklyLimit.limit) * 100, 100)}%` }}
                />
              </div>
              {weeklyLimit.remaining > 0 ? (
                <p className="text-xs text-primary font-medium">
                  {formatCurrency(weeklyLimit.remaining)} available
                </p>
              ) : (
                <p className="text-xs text-orange-600 font-medium">
                  Limit reached
                </p>
              )}
            </div>
          )}

          {/* Deposit/Withdraw Section - Compact design */}
          <div className="space-y-2.5">
            <Input
              type="number"
              placeholder="Enter amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              min="5"
              max={Math.max(weeklyLimit?.remaining || 50, balance)}
              step="0.01"
              className="w-full h-9 text-sm"
            />
            
            <div className="grid grid-cols-2 gap-2">
              <CheckoutButton
                amount={
                  depositAmount
                    ? Math.round(parseFloat(depositAmount) * 100)
                    : 500
                }
                className="h-9 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                disabled={weeklyLimit ? weeklyLimit.remaining <= 0 : false}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Deposit
              </CheckoutButton>
              
              <Button
                onClick={() => {
                  // TODO: Implement withdrawal functionality
                  console.log('Withdraw requested:', depositAmount);
                }}
                disabled={!depositAmount || parseFloat(depositAmount) > balance || parseFloat(depositAmount) < 5}
                className="h-9 px-3 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <ArrowDownCircle className="w-3.5 h-3.5 mr-1" />
                Withdraw
              </Button>
            </div>
            
            {/* Quick amount buttons - compact design */}
            <div className="grid grid-cols-4 gap-1.5">
              {[10, 25, 50].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setDepositAmount(amount.toString())}
                  disabled={weeklyLimit && amount > weeklyLimit.remaining}
                  className="h-7 text-xs border-primary/20 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  €{amount}
                </Button>
              ))}
              {balance > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDepositAmount(Math.min(balance, 100).toFixed(2))}
                  className="h-7 text-xs text-primary/70 border-primary/20 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Max
                </Button>
              )}
            </div>
            
            <div className="text-center pt-0.5">
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded-full px-2 py-0.5">
                <CreditCard className="w-2.5 h-2.5" />
                <span>Secured by Stripe</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History - Ultra compact mobile design */}
      <Card className="shadow-md backdrop-blur-sm">
        <CardHeader className="pb-2 px-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="w-5 h-5 bg-gradient-to-br from-primary to-primary/80 rounded-md flex items-center justify-center">
              <DollarSign className="w-3 h-3 text-white" />
            </div>
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="text-center py-6 px-3 text-muted-foreground">
              <div className="w-12 h-12 mx-auto mb-3 bg-muted/50 rounded-full flex items-center justify-center">
                <WalletIcon className="w-6 h-6 opacity-60" />
              </div>
              <p className="text-sm font-medium">No transactions yet</p>
              <p className="text-xs mt-1 opacity-75">History will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {transactions.slice(0, 6).map((transaction) => (
                <div key={transaction.id} className="p-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex-shrink-0 w-7 h-7 bg-muted/60 rounded-full flex items-center justify-center">
                        {getTransactionIcon(transaction.type, transaction.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs truncate leading-tight">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground/80">
                            {formatDistanceToNow(
                              new Date(transaction.createdAt),
                              { addSuffix: true }
                            )}
                          </p>
                          <Badge
                            variant={getStatusBadgeVariant(transaction.status)}
                            className="text-xs h-4 px-1.5"
                          >
                            {getStatusDisplayText(transaction.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p
                        className={`font-bold text-xs ${getTransactionColor(
                          transaction.type,
                          transaction.status
                        )}`}
                      >
                        {transaction.status === "cancelled" || 
                         transaction.status === "failed" || 
                         transaction.status === "expired" 
                          ? "—" 
                          : transaction.type === "deposit" || transaction.type === "refund"
                          ? "+"
                          : "-"}
                        {transaction.status === "cancelled" || 
                         transaction.status === "failed" || 
                         transaction.status === "expired" 
                          ? "€0.00" 
                          : formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {transactions.length > 6 && (
                <div className="p-3 text-center border-t border-border/50">
                  <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground hover:text-foreground">
                    View All {transactions.length}
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