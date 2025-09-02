import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const EmailVerificationRequired = () => {
  const { resendVerification, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsResending(true);
    try {
      await resendVerification(email);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-xl">Email Verification Required</CardTitle>
          <CardDescription className="text-sm">
            Please verify your email address to access the platform.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
              <span>Check your email inbox and spam folder</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
              <span>Click the verification link in the email</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
              <span>Return here and refresh the page</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              Didn't receive the email? Enter your email to resend:
            </p>
            
            <form onSubmit={handleResendVerification} className="space-y-3">
              <div>
                <Label htmlFor="email" className="sr-only">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isResending || !email.trim()}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="border-t pt-4">
            <Button
              variant="outline"
              onClick={logout}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationRequired;