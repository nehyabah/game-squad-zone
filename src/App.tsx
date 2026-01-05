import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth.tsx";
import { SportProvider } from "@/hooks/use-sport.tsx";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import SuccessPage from "./pages/success";
import AuthSuccessPage from "./pages/auth-success";
import AuthCallback from "./pages/auth-callback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SportProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/nfl" element={<Index sport="nfl" />} />
              <Route path="/six-nations" element={<Index sport="six-nations" />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/success" element={<AuthSuccessPage />} />
              <Route path="/success" element={<SuccessPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SportProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;// Force rebuild Tue, Sep  9, 2025  6:11:42 PM
