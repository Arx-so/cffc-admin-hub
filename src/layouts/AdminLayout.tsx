import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout() {
  const { user, isInitialized } = useAuthStore();
  const { data: profile, isFetched } = useProfileQuery();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (isFetched && profile && profile.role !== "admin") return <Navigate to="/login" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <main className="flex-1 flex flex-col">
          <header className="flex h-14 items-center border-b border-border px-4">
            <SidebarTrigger />
          </header>
          <div className="flex-1 p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
