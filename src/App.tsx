import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth.tsx";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SuccessPage from "./pages/success";
import AuthSuccessPage from "./pages/auth-success";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthGuard>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/success" element={<AuthSuccessPage />} />
              <Route path="/success" element={<SuccessPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthGuard>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;