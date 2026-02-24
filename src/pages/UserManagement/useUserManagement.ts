import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, AppUser } from "@/data/mock";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";

export function useUserManagement() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: fetchUsers,
  });
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const { toast } = useToast();

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleBlockMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 200));
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<AppUser[]>(queryKeys.users.all, (prev) =>
        prev
          ? prev.map((user) =>
              user.id === id ? { ...user, status: user.status === "ativo" ? ("bloqueado" as const) : ("ativo" as const) } : user
            )
          : []
      );
      toast({ title: "Status atualizado" });
    },
  });

  const removeValidationMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 200));
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<AppUser[]>(queryKeys.users.all, (prev) =>
        prev ? prev.map((user) => (user.id === id ? { ...user, validated: false } : user)) : []
      );
      toast({ title: "Validação removida" });
    },
  });

  const addValidationMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 200));
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<AppUser[]>(queryKeys.users.all, (prev) =>
        prev ? prev.map((user) => (user.id === id ? { ...user, validated: true } : user)) : []
      );
      toast({ title: "Conta validada" });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      await new Promise((r) => setTimeout(r, 200));
      return email;
    },
    onSuccess: (email) => {
      const prev = queryClient.getQueryData<AppUser[]>(queryKeys.users.all) ?? [];
      const newAdmin: AppUser = {
        id: String(prev.length + 1),
        name: email.split("@")[0],
        email,
        role: "admin",
        status: "ativo",
        createdAt: new Date().toISOString().split("T")[0],
        validated: true,
      };
      queryClient.setQueryData<AppUser[]>(queryKeys.users.all, [...prev, newAdmin]);
      setNewAdminEmail("");
      toast({ title: "Admin criado" });
    },
  });

  const createAdmin = () => {
    if (!newAdminEmail) return;
    createAdminMutation.mutate(newAdminEmail);
  };

  return {
    filtered,
    users,
    isLoading,
    error,
    search,
    setSearch,
    selectedUser,
    setSelectedUser,
    newAdminEmail,
    setNewAdminEmail,
    toggleBlockMutation,
    removeValidationMutation,
    addValidationMutation,
    createAdminMutation,
    createAdmin,
  };
}
