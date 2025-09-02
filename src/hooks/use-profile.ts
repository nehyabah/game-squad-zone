import { useState, useEffect } from 'react';
import { profileAPI, type UserProfile, type ProfileUpdateData } from '@/lib/api/profile';
import { useToast } from '@/hooks/use-toast';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const userProfile = await profileAPI.getProfile();
      setProfile(userProfile);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: ProfileUpdateData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await profileAPI.updateProfile(data);
      setProfile(response.user);
      toast({
        title: 'Success',
        description: response.message,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch profile if there's an auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
      setError('Not authenticated');
    }
  }, []);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}