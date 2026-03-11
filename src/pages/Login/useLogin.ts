import { useState } from "react";
import { useAuthStore } from "@/stores";
import { useNavigate } from "react-router-dom";

export function useLogin() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Preencha todos os campos");
      return;
    }
    const result = await login(email, password);
    if (result.ok) navigate("/");
    else setError(result.reason === "banned" ? "Conta bloqueada." : "Credenciais inválidas");
  };

  return { email, setEmail, password, setPassword, error, isLoading, handleSubmit };
}
