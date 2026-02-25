import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useLogin } from "./useLogin";
import { Login } from "./Login";

export default function LoginPage() {
  const { user, isInitialized } = useAuthStore();
  const props = useLogin();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;

  return <Login {...props} />;
}
