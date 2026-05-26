import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthStore, type UserRole } from "@/stores";

interface ProfileRow {
  name: string | null;
  role: UserRole;
}

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profile")
    .select("name, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { name: data.name ?? null, role: (data.role ?? "athlete") as UserRole };
}

/** Fetches current user's profile with useQuery and syncs name/role into auth store. */
export function useProfileQuery() {
  const userId = useAuthStore((s) => s.user?.id);
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: queryKeys.profile(userId ?? ""),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);

  return query;
}
