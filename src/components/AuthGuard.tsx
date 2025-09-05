import { useAuth } from '@/hooks/use-auth';
import EmailVerificationRequired from './EmailVerificationRequired';
import ProfileSetup from './ProfileSetup';
import { useLocation } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, emailVerificationRequired, profileSetupRequired, loading, isAuthenticated, login } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show email verification screen instead of looping back to login
  if (emailVerificationRequired) {
    return <EmailVerificationRequired />;
  }

  // If we're on auth routes, don't trigger login again; let the flow complete
  const onAuthRoute = location.pathname === '/auth/callback' || location.pathname === '/auth/success';
  if ((!isAuthenticated || !user) && onAuthRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Completing sign-in…</p>
        </div>
      </div>
    );
  }

  // Not authenticated: trigger login once for non-auth routes
  if (!isAuthenticated || !user) {
    if (typeof login === 'function') {
      login();
    }
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
