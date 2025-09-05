import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI, type User, type UserStats } from '@/lib/api/auth';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  stats: UserStats | null;
  loading: boolean;
  isAuthenticated: boolean;
  emailVerificationRequired: boolean;
  profileSetupRequired: boolean;
  login: () => void;
  logout: () => Promise<void>;
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    username?: string;
    avatarUrl?: string;
    displayName?: string;
  }) => Promise<boolean>;
  refreshStats: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
  const [profileSetupRequired, setProfileSetupRequired] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  const fetchProfile = async () => {
    try {
      if (!authAPI.isAuthenticated()) {
        setUser(null);
        setStats(null);
        return;
      }

      const [profileData, statsData] = await Promise.all([
        authAPI.getProfile(),
        authAPI.getUserStats(),
      ]);

      setUser(profileData);
      setStats(statsData);
      
      // Check if profile setup is required
      const needsProfileSetup = !profileData.displayName || profileData.displayName.trim() === '';
      setProfileSetupRequired(needsProfileSetup);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      
      // Check if it's email verification required
      if (error instanceof Error && error.message === 'EMAIL_VERIFICATION_REQUIRED') {
        setEmailVerificationRequired(true);
        setUser(null);
        setStats(null);
        return;
      }
      
      // If token is invalid, clear it
      if (error instanceof Error && error.message.includes('401')) {
        authAPI.clearToken();
        setUser(null);
        setStats(null);
        setEmailVerificationRequired(false);
      }
    }
  };

  const login = () => {
    // Prevent multiple login attempts
    if (loading) return;
    
    try {
      authAPI.getLoginUrl().then(({ authUrl }) => {
        if (authUrl) {
          window.location.href = authUrl;
        } else {
          console.error('No auth URL received');
        }
      }).catch((error) => {
        console.error('Login failed:', error);
      });
    } catch (error) {
      console.error('Login initiation failed:', error);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setStats(null);
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state anyway
      authAPI.clearToken();
      setUser(null);
      setStats(null);
    }
  };

  const updateProfile = async (data: {
    firstName?: string;
    lastName?: string;
    username?: string;
    avatarUrl?: string;
    displayName?: string;
  }): Promise<boolean> => {
    try {
      const updatedUser = await authAPI.updateProfile(data);
      setUser(updatedUser);
      
      // Check if profile setup is still required after update
      const needsProfileSetup = !updatedUser.displayName || updatedUser.displayName.trim() === '';
      setProfileSetupRequired(needsProfileSetup);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast({
        title: 'Update failed',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const refreshStats = async () => {
    try {
      const statsData = await authAPI.getUserStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  };

  const resendVerification = async (email: string) => {
    try {
      const result = await authAPI.resendVerification(email);
      toast({
        title: 'Verification email sent',
        description: result.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend verification email';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      // Only check for auth callback parameters on the success page
      const isSuccessPage = window.location.pathname === '/auth/success';
      
      if (isSuccessPage) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const idToken = urlParams.get('id_token');
        const error = urlParams.get('error');
        
        if (error) {
          // Handle authentication error
          console.error('Authentication error:', error);
          toast({
            title: 'Authentication failed',
            description: 'There was an error during authentication. Please try again.',
            variant: 'destructive',
          });
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (token && token.trim() !== '') {
          // We got an access token from successful session creation
          console.log('Received token from callback:', token);
          authAPI.setToken(token);
          toast({
            title: 'Welcome!',
            description: 'You have been successfully authenticated.',
          });
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (idToken && idToken.trim() !== '') {
          // Backend sends 'token' not 'id_token', so this shouldn't happen
          // But if it does, just use it as the access token
          console.warn('Received id_token parameter - treating as access token');
          authAPI.setToken(idToken);
          toast({
            title: 'Welcome!',
            description: 'You have been successfully authenticated.',
          });
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
      
      // No auto-authentication - let users choose their method
      
      try {
        await fetchProfile();
      } catch (error) {
        console.error('Initial auth failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return {
    user,
    stats,
    loading,
    isAuthenticated: !!user,
    emailVerificationRequired,
    profileSetupRequired,
    login,
    logout,
    updateProfile,
    refreshStats,
    resendVerification,
  };
}

// Auth context provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}