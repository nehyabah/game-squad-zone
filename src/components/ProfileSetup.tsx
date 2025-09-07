import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowRight, User, UserCircle } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      </div>
      
      {/* Floating orbs for depth */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full filter blur-[128px] opacity-20 animate-pulse animation-delay-2000"></div>
      
      <Card className="relative w-full max-w-md backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/20 shadow-2xl">
        <CardHeader className="text-center space-y-6 pb-2">
          <div className="mx-auto relative">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-white">
              Almost there!
            </CardTitle>
            <CardDescription className="text-gray-300">
              Just a few details to personalize your experience
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name - Required */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium text-gray-200 flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                Display Name <span className="text-pink-400">*</span>
              </Label>
              <Input
                id="displayName"
                placeholder="Choose your arena name"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/15 focus:border-purple-400 transition-all"
                required
              />
              <p className="text-xs text-gray-400">
                Your identity in squads and leaderboards
              </p>
            </div>

            {/* Name fields in a grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-200 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  First Name
                </Label>
                <Input
                  id="firstName"
                  placeholder="Optional"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:bg-white/15 focus:border-purple-400 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-200">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Optional"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:bg-white/15 focus:border-purple-400 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3 pt-6">
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Creating your profile...
                  </>
                ) : (
                  <>
                    Enter the Arena
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={skipSetup}
                disabled={isSubmitting}
                className="w-full text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                I'll do this later
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;