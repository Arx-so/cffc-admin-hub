import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores";
import { AuthProfileSync } from "@/components/AuthProfileSync";
import AdminLayout from "@/layouts/AdminLayout";
import Login from "@/pages/Login";
import Reports from "@/pages/Reports";
import Videos from "@/pages/Videos";
import Validations from "@/pages/Validations";
import UserManagement from "@/pages/UserManagement";
import NotFound from "@/pages/NotFound";

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
          <Routes>
            <Route path="/login" element={<Login />} />
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
