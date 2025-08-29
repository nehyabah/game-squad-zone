import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard,
  Lock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface StripeCardFormProps {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const StripeCardForm = ({ amount, onSuccess, onCancel }: StripeCardFormProps) => {
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
    zip: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateCard = () => {
    const newErrors: Record<string, string> = {};
    
    // Card number validation (simplified)
    const cardNumber = cardData.number.replace(/\s/g, '');
    if (!cardNumber) {
      newErrors.number = "Card number is required";
    } else if (cardNumber.length < 13 || cardNumber.length > 19) {
      newErrors.number = "Invalid card number";
    }
    
    // Expiry validation
    if (!cardData.expiry) {
      newErrors.expiry = "Expiry date is required";
    } else if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      newErrors.expiry = "Invalid expiry format (MM/YY)";
    } else {
      const [month, year] = cardData.expiry.split('/');
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.expiry = "Invalid month";
      } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiry = "Card has expired";
      }
    }
    
    // CVC validation
    if (!cardData.cvc) {
      newErrors.cvc = "CVC is required";
    } else if (cardData.cvc.length < 3 || cardData.cvc.length > 4) {
      newErrors.cvc = "Invalid CVC";
    }
    
    // Name validation
    if (!cardData.name.trim()) {
      newErrors.name = "Cardholder name is required";
    }
    
    // ZIP validation
    if (!cardData.zip.trim()) {
      newErrors.zip = "ZIP code is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCard()) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Payment Successful",
        description: `$${amount.toFixed(2)} has been added to your wallet`,
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'number') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiry') {
      formattedValue = formatExpiry(value);
    } else if (field === 'cvc') {
      formattedValue = value.replace(/[^0-9]/gi, '').substring(0, 4);
    } else if (field === 'zip') {
      formattedValue = value.replace(/[^0-9]/gi, '').substring(0, 5);
    }
    
    setCardData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <CreditCard className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Add Funds</CardTitle>
        <p className="text-sm text-muted-foreground">
          Add {formatCurrency(amount)} to your wallet
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardData.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                className={`pl-10 ${errors.number ? 'border-destructive' : ''}`}
                maxLength={19}
              />
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            {errors.number && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.number}
              </p>
            )}
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry</Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                value={cardData.expiry}
                onChange={(e) => handleInputChange('expiry', e.target.value)}
                className={errors.expiry ? 'border-destructive' : ''}
                maxLength={5}
              />
              {errors.expiry && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.expiry}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                placeholder="123"
                value={cardData.cvc}
                onChange={(e) => handleInputChange('cvc', e.target.value)}
                className={errors.cvc ? 'border-destructive' : ''}
                maxLength={4}
              />
              {errors.cvc && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.cvc}
                </p>
              )}
            </div>
          </div>

          {/* Cardholder Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Cardholder Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={cardData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* ZIP Code */}
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              placeholder="12345"
              value={cardData.zip}
              onChange={(e) => handleInputChange('zip', e.target.value)}
              className={errors.zip ? 'border-destructive' : ''}
              maxLength={5}
            />
            {errors.zip && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.zip}
              </p>
            )}
          </div>

          <Separator />

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Lock className="w-4 h-4" />
            <span>Your payment information is encrypted and secure</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Pay {formatCurrency(amount)}
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StripeCardForm;