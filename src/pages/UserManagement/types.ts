import type { UserRole } from "@/stores";

/** Row returned by RPC list_profiles_for_admin (contract). */
export interface ProfileRow {
	id: string;
	name: string | null;
	email: string;
	role: UserRole;
	created_at: string;
	phone: string | null;
	city: string | null;
	state: string | null;
	birth_date: string | null;
	banned_until: string | null;
	validated: boolean;
	total_count: number;
}

/** Derived status for display. */
export type UserStatus = "ativo" | "bloqueado";

export function statusFromBannedUntil(bannedUntil: string | null): UserStatus {
	if (!bannedUntil) return "ativo";
	const until = new Date(bannedUntil);
	return until > new Date() ? "bloqueado" : "ativo";
}

export const ROLE_LABELS: Record<UserRole, string> = {
	athlete: "Atleta",
	pro: "Profissional",
	club: "Clube",
	admin: "Admin",
};
