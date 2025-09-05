import { useAuth } from '@/hooks/use-auth';
import ProfileSetup from './ProfileSetup';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, profileSetupRequired, loading, isAuthenticated, login } = useAuth();

  useEffect(() => {
    // Only trigger login once if not authenticated and not loading
    if (!loading && !isAuthenticated && !user && typeof login === 'function') {
      login();
    }
  }, [loading, isAuthenticated, user, login]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated: show redirecting message
  if (!isAuthenticated || !user) {
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
