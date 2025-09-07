import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle, ArrowRight, User, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { profileAPI } from '@/lib/api/profile';

const ProfileSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.displayName.trim()) {
      toast({
        title: 'Display name required',
        description: 'Please enter a display name to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await profileAPI.updateProfile({
        displayName: formData.displayName.trim(),
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
      });

      toast({
        title: 'Welcome to Game Squad Zone!',
        description: 'Your profile has been set up successfully.',
      });
      
      // Refresh the page to reload the auth state
      window.location.reload();
    } catch (error) {
      console.error('Profile setup error:', error);
      toast({
        title: 'Setup failed',
        description: 'Failed to set up your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const skipSetup = async () => {
    // Set a basic display name based on email if user skips
    const basicDisplayName = user?.email?.split('@')[0] || 'User';
    setIsSubmitting(true);
    try {
      await profileAPI.updateProfile({
        displayName: basicDisplayName,
      });
      toast({
        title: 'Profile setup skipped',
        description: 'You can update your profile anytime from settings.',
      });
      
      // Refresh the page to reload the auth state
      window.location.reload();
    } catch (error) {
      console.error('Skip setup error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to Game Squad Zone</h1>
          <p className="text-muted-foreground mt-2">Let's set up your profile to get started</p>
        </div>

        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Create Your Profile</CardTitle>
            <CardDescription>
              Choose how you'll appear to other players
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name - Required */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-muted-foreground" />
                  Display Name
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  placeholder="Enter your display name"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="h-10"
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  This is how you'll appear in squads and leaderboards
                </p>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Optional"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Optional"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Email display */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Account Email</p>
                <p className="text-sm font-medium text-foreground">{user?.email}</p>
              </div>

              <div className="space-y-3 pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-11 font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={skipSetup}
                  disabled={isSubmitting}
                  className="w-full h-11 text-muted-foreground hover:text-foreground"
                >
                  Skip for now
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <div className="w-2 h-2 rounded-full bg-muted"></div>
          <div className="w-2 h-2 rounded-full bg-muted"></div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;