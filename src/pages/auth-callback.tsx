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
          // Exchange the code for tokens
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/auth/okta/exchange`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ code, state }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            
            // Store the tokens
            if (data.accessToken) {
              localStorage.setItem("authToken", data.accessToken);
              if (data.refreshToken) {
                localStorage.setItem("refreshToken", data.refreshToken);
              }
            }

            // Redirect to the main app or success page
            navigate("/auth/success", { replace: true });
          } else {
            console.error("Failed to exchange code for tokens");
            navigate("/", { replace: true });
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