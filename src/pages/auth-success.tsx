import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // The AuthProvider will automatically handle the token from URL params
    // and redirect to the main page once authenticated
    const timer = setTimeout(() => {
      navigate("/");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full mx-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Authentication Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Welcome to Game Squad Zone! You'll be redirected to your dashboard shortly.
        </p>
        
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        
        <p className="text-sm text-gray-500">
          Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
}