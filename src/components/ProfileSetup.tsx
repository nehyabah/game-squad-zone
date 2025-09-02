import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Sparkles, ArrowRight, Upload } from 'lucide-react';
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
    avatarUrl: user?.avatarUrl || '',
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
        avatarUrl: formData.avatarUrl.trim() || undefined,
      });

      toast({
        title: 'Welcome to Game Squad Zone! 🎉',
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

  const getInitials = () => {
    if (formData.displayName) {
      return formData.displayName.substring(0, 2).toUpperCase();
    }
    if (formData.firstName || formData.lastName) {
      return `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to Game Squad Zone!
            </CardTitle>
            <CardDescription className="text-sm mt-2">
              Let's set up your profile to get started with your picks and squads.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex justify-center">
              <Avatar className="w-20 h-20">
                <AvatarImage src={formData.avatarUrl} alt="Profile" />
                <AvatarFallback className="text-lg font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Display Name - Required */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                Display Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="displayName"
                placeholder="How should others see you?"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className="transition-all focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-muted-foreground">
                This is how other players will see you in squads and leaderboards
              </p>
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                First Name
              </Label>
              <Input
                id="firstName"
                placeholder="Your first name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="transition-all focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last Name
              </Label>
              <Input
                id="lastName"
                placeholder="Your last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="transition-all focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Avatar URL */}
            <div className="space-y-2">
              <Label htmlFor="avatarUrl" className="text-sm font-medium">
                Profile Picture URL
              </Label>
              <Input
                id="avatarUrl"
                placeholder="https://example.com/your-photo.jpg"
                value={formData.avatarUrl}
                onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                className="transition-all focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Add a profile picture URL
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={skipSetup}
                disabled={isSubmitting}
                className="w-full text-sm"
              >
                Skip for now
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;