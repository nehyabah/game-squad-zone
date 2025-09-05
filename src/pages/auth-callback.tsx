import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

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
          // The backend /callback endpoint expects GET with query params
          // and will redirect back with the token, so we'll just redirect there
          window.location.href = `${
            import.meta.env.VITE_API_URL
          }/api/auth/callback?code=${encodeURIComponent(
            code
          )}&state=${encodeURIComponent(state || "")}`;
          // The backend will handle the rest and redirect back
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
