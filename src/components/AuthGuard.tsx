import { useAuth } from '@/hooks/use-auth';
import ProfileSetup from './ProfileSetup';
import { useEffect, useState } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, profileSetupRequired, loading, isAuthenticated, login } = useAuth();
  const [loginTriggered, setLoginTriggered] = useState(false);

  useEffect(() => {
    // Only trigger login once if not authenticated and not loading
    if (!loading && !isAuthenticated && !loginTriggered) {
      setLoginTriggered(true);
      login();
    }
  }, [loading, isAuthenticated, loginTriggered, login]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we have a token but no user yet, show loading (user profile is being fetched)
  if (isAuthenticated && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Not authenticated: show redirecting message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (profileSetupRequired) {
    return <ProfileSetup />;
  }

  return <>{children}</>;
};

export default AuthGuard;
