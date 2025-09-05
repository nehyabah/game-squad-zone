// AuthGuard.tsx
import { useAuth } from "@/hooks/use-auth";
import ProfileSetup from "./ProfileSetup";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

interface AuthGuardProps {
  children: React.ReactNode;
}

const LOGIN_ATTEMPT_KEY = "auth.loginAttempted";

// ---- Safe sessionStorage helpers (SSR/Privacy-mode safe) ----
function safeSetItem(key: string, value: string) {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(key, value);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`sessionStorage.setItem failed for "${key}"`, err);
    }
  }
}

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      return window.sessionStorage.getItem(key);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`sessionStorage.getItem failed for "${key}"`, err);
    }
  }
  return null;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, profileSetupRequired, loading, isAuthenticated, login } =
    useAuth();
  const location = useLocation();
  const [hydrated, setHydrated] = useState(false);

  // Persisted "attempted login" survives full IdP redirects (hard reload)
  const attemptedRef = useRef<boolean>(false);

  // Hydrate once after mount
  useEffect(() => {
    setHydrated(true);
    attemptedRef.current = safeGetItem(LOGIN_ATTEMPT_KEY) === "1";
  }, []);

  // Treat these routes as "auth system" routes the guard should not interfere with
  const isCallbackRoute = useMemo(() => {
    const path = location.pathname || "";
    return (
      path.startsWith("/auth/callback") ||
      path.startsWith("/login") ||
      path.startsWith("/logout")
    );
  }, [location.pathname]);

  // Trigger login exactly once per browser session (avoid loops)
  useEffect(() => {
    if (loading || isAuthenticated || isCallbackRoute) return;

    if (!attemptedRef.current) {
      attemptedRef.current = true;
      safeSetItem(LOGIN_ATTEMPT_KEY, "1");
      login(); // redirect to IdP
    }
    // DO NOT include `login` to avoid firing on new fn identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated, isCallbackRoute]);

  // Safety net: if tokens exist but profile fetch drags on, surface a hint
  const [profileWaitExpired, setProfileWaitExpired] = useState(false);
  useEffect(() => {
    if (isAuthenticated && !user) {
      const t = setTimeout(() => setProfileWaitExpired(true), 15000);
      return () => clearTimeout(t);
    }
    setProfileWaitExpired(false);
  }, [isAuthenticated, user]);

  // Gate initial paint (helps with SSR/flicker) and show spinners
  if (!hydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (isCallbackRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-lg">Finalising sign-in…</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-lg">
            {profileWaitExpired
              ? "Still fetching your profile… (check API/CORS/cookies)"
              : "Loading your profile…"}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-lg">Redirecting to login…</p>
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
