import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import { functions } from "@/lib/functions";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores";
import type { ProfileRow } from "./types";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

async function listProfilesForAdmin(
	page: number,
	pageSize: number,
	search: string
): Promise<{ rows: ProfileRow[]; totalCount: number }> {
	const offset = page * pageSize;
	const { data, error } = await supabase.rpc("list_profiles_for_admin", {
		p_offset: offset,
		p_limit: pageSize,
		p_search: search.trim() || null,
	});
	if (error) throw error;
	const rows = (data ?? []) as ProfileRow[];
	const totalCount = rows[0]?.total_count ?? 0;
	return { rows, totalCount };
}

export function useUserManagement() {
	const queryClient = useQueryClient();
	const userId = useAuthStore((s) => s.user?.id);
	const [page, setPage] = useState(0);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);
	const [newAdminEmail, setNewAdminEmail] = useState("");
	const [createAdminModalOpen, setCreateAdminModalOpen] = useState(false);
	const { toast } = useToast();

	useEffect(() => {
		const t = setTimeout(() => {
			setSearch(searchInput);
			setPage(0);
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(t);
	}, [searchInput]);

	const listKey = queryKeys.users.list({ page, pageSize: PAGE_SIZE, search });

	const {
		data,
		isLoading,
		error,
		isPlaceholderData,
	} = useQuery({
		queryKey: listKey,
		queryFn: () => listProfilesForAdmin(page, PAGE_SIZE, search),
		placeholderData: (prev) => prev,
	});

	const rows = data?.rows ?? [];
	const totalCount = data?.totalCount ?? 0;
	const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

	const setSearchInputOnly = useCallback((value: string) => {
		setSearchInput(value);
	}, []);

	const toggleBlockMutation = useMutation({
		mutationFn: async (targetUserId: string) => {
			const { data: session } = await supabase.auth.getSession();
			const token = session.session?.access_token;
			if (!token) throw new Error("Não autenticado");
			const current = rows.find((r) => r.id === targetUserId);
			const banned = !!current?.banned_until && new Date(current.banned_until) > new Date();
			const url = banned ? functions.adminUnblockUser : functions.adminBlockUser;
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ userId: targetUserId }),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.message ?? res.statusText ?? "Erro ao atualizar status");
			}
			return { targetUserId, nowBlocked: !banned };
		},
		onSuccess: ({ targetUserId, nowBlocked }) => {
			const newBannedUntil = nowBlocked
				? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
				: null;
			queryClient.setQueriesData<{ rows: ProfileRow[]; totalCount: number }>(
				{ queryKey: ["users", "list"] },
				(old) => {
					if (!old) return old;
					return {
						...old,
						rows: old.rows.map((r) =>
							r.id === targetUserId ? { ...r, banned_until: newBannedUntil } : r
						),
					};
				}
			);
			setSelectedUser((prev) =>
				prev?.id === targetUserId ? { ...prev, banned_until: newBannedUntil } : prev
			);
			toast({ title: "Status atualizado", variant: "success" });
		},
		onError: (err: Error) => {
			toast({ title: "Erro", description: err.message, variant: "destructive" });
		},
	});

	const removeValidationMutation = useMutation({
		mutationFn: async (athleteUserId: string) => {
			const { error } = await supabase
				.from("validation")
				.delete()
				.eq("athlete_user_id", athleteUserId);
			if (error) throw error;
			return athleteUserId;
		},
		onSuccess: (athleteUserId) => {
			queryClient.setQueriesData<{ rows: ProfileRow[]; totalCount: number }>(
				{ queryKey: ["users", "list"] },
				(old) => {
					if (!old) return old;
					return {
						...old,
						rows: old.rows.map((r) =>
							r.id === athleteUserId ? { ...r, validated: false } : r
						),
					};
				}
			);
			setSelectedUser((prev) =>
				prev?.id === athleteUserId ? { ...prev, validated: false } : prev
			);
			toast({ title: "Validação removida", variant: "success" });
		},
		onError: (err: Error) => {
			toast({ title: "Erro", description: err.message, variant: "destructive" });
		},
	});

	const addValidationMutation = useMutation({
		mutationFn: async (athleteUserId: string) => {
			if (!userId) throw new Error("Não autenticado");
			const { error } = await supabase.from("validation").insert({
				athlete_user_id: athleteUserId,
				professional_user_id: userId,
				status: "approved",
			});
			if (error) throw error;
			return athleteUserId;
		},
		onSuccess: (athleteUserId) => {
			queryClient.setQueriesData<{ rows: ProfileRow[]; totalCount: number }>(
				{ queryKey: ["users", "list"] },
				(old) => {
					if (!old) return old;
					return {
						...old,
						rows: old.rows.map((r) =>
							r.id === athleteUserId ? { ...r, validated: true } : r
						),
					};
				}
			);
			setSelectedUser((prev) =>
				prev?.id === athleteUserId ? { ...prev, validated: true } : prev
			);
			toast({ title: "Conta validada", variant: "success" });
		},
		onError: (err: Error) => {
			toast({ title: "Erro", description: err.message, variant: "destructive" });
		},
	});

	const createAdminMutation = useMutation({
		mutationFn: async (email: string) => {
			const { data: session } = await supabase.auth.getSession();
			const token = session.session?.access_token;
			if (!token) throw new Error("Não autenticado");
			const res = await fetch(functions.adminCreateAdmin, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ email }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error((data as { message?: string }).message ?? "Erro ao criar admin");
			return { email, userId: (data as { userId?: string }).userId } as { email: string; userId: string };
		},
		onSuccess: (result) => {
			const newRow: ProfileRow = {
				id: result.userId,
				email: result.email,
				name: result.email.split("@")[0] || "",
				role: "admin",
				created_at: new Date().toISOString(),
				phone: null,
				city: null,
				state: null,
				birth_date: null,
				banned_until: null,
				validated: false,
				total_count: 0,
			};
			queryClient.setQueryData<{ rows: ProfileRow[]; totalCount: number }>(listKey, (prev) => {
				if (!prev) return prev;
				const nextRows = [newRow, ...prev.rows].slice(0, PAGE_SIZE);
				const nextTotal = prev.totalCount + 1;
				return {
					rows: nextRows.map((r) => ({ ...r, total_count: nextTotal })),
					totalCount: nextTotal,
				};
			});
			setNewAdminEmail("");
			setCreateAdminModalOpen(false);
			toast({ title: "Admin criado com sucesso", variant: "success" });
		},
		onError: () => {
			toast({
				title: "Não foi possível criar o administrador.",
				variant: "destructive",
			});
		},
	});

	const createAdmin = () => {
		if (!newAdminEmail.trim()) return;
		createAdminMutation.mutate(newAdminEmail.trim());
	};

	return {
		rows,
		totalCount,
		totalPages,
		page,
		setPage,
		pageSize: PAGE_SIZE,
		isLoading,
		error: error as Error | null,
		search: searchInput,
		setSearch: setSearchInputOnly,
		createAdminModalOpen,
		setCreateAdminModalOpen,
		selectedUser,
		setSelectedUser,
		newAdminEmail,
		setNewAdminEmail,
		toggleBlockMutation,
		removeValidationMutation,
		addValidationMutation,
		createAdminMutation,
		createAdmin,
		isPlaceholderData,
	};
}
