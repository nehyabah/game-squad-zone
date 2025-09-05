import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authAPI } from "@/lib/api/auth";
import { toast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get the authorization code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const error = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        if (error) {
          console.error("Auth0 callback error:", error, errorDescription);
          navigate("/", { replace: true });
          return;
        }

        if (code) {
          // Prefer JSON exchange to avoid fragile redirects
          try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiBase}/api/auth/token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, state }),
            });

            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error_description || err.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            if (data?.accessToken) {
              authAPI.setToken(data.accessToken);
              // Force a small delay to ensure token is saved
              await new Promise(resolve => setTimeout(resolve, 100));
              toast({ title: 'Welcome!', description: 'You have been successfully authenticated.' });
              // Navigate with React Router to maintain state
              navigate('/auth/success', { replace: true });
              return;
            }

            // Fallback: if no accessToken returned, attempt legacy redirect flow
            window.location.href = `${apiBase}/api/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}`;
          } catch (e) {
            console.error('Token exchange failed:', e);
            // Fallback to legacy redirect flow
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            window.location.href = `${apiBase}/api/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}`;
          }
        } else {
          console.error("No authorization code found in callback");
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Error processing Auth0 callback:", error);
        navigate("/", { replace: true });
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        <p className="mt-4 text-lg">Processing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
