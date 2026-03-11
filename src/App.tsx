import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores";
import { AuthProfileSync } from "@/components/AuthProfileSync";
import AdminLayout from "@/layouts/AdminLayout";
import Login from "@/pages/Login";
import SetPassword from "@/pages/SetPassword/SetPassword";
import Reports from "@/pages/Reports";
import Videos from "@/pages/Videos";
import Validations from "@/pages/Validations";
import UserManagement from "@/pages/UserManagement";
import NotFound from "@/pages/NotFound";

/** Detects invite/recovery hash fragments and redirects to /set-password */
function AuthRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes("type=invite") || hash.includes("type=recovery"))) {
      navigate("/set-password" + hash, { replace: true });
    }
  }, [navigate]);

  return null;
}

const App = () => {
  useEffect(() => {
    useAuthStore.getState().initSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProfileSync />
        <BrowserRouter>
          <AuthRedirect />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Reports />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/validacoes" element={<Validations />} />
              <Route path="/usuarios" element={<UserManagement />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
