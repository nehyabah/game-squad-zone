import { useAuth } from '@/hooks/use-auth';
import EmailVerificationRequired from './EmailVerificationRequired';
import ProfileSetup from './ProfileSetup';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { emailVerificationRequired, profileSetupRequired, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (emailVerificationRequired) {
    return <EmailVerificationRequired />;
  }

  if (profileSetupRequired) {
    return <ProfileSetup />;
  }

  return <>{children}</>;
};

export default AuthGuard;