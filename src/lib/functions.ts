const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "") ?? "";

export const functions = {
  adminBlockUser: `${base}/functions/v1/admin-block-user`,
  adminUnblockUser: `${base}/functions/v1/admin-unblock-user`,
  adminCreateAdmin: `${base}/functions/v1/admin-create-admin`
} as const;
