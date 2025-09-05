import { useAuth } from '@/hooks/use-auth';
import EmailVerificationRequired from './EmailVerificationRequired';
import ProfileSetup from './ProfileSetup';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, emailVerificationRequired, profileSetupRequired, loading, isAuthenticated, login } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    // Redirect to Okta/Auth0 login
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

  // Email verification disabled - skip this check
  // if (emailVerificationRequired) {
  //   return <EmailVerificationRequired />;
  // }

  if (profileSetupRequired) {
    return <ProfileSetup />;
  }

  return <>{children}</>;
};

export default AuthGuard;