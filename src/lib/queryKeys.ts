export const queryKeys = {
  profile: (userId: string) => ["profile", userId] as const,
  reports: {
    all: ["reports"] as const,
  },
  videos: {
    all: ["videos"] as const,
    pending: ["videos", "pending"] as const,
  },
  validations: {
    all: ["validations"] as const,
  },
  users: {
    all: ["users"] as const,
    list: (params: { page: number; pageSize: number; search: string }) =>
      ["users", "list", params.page, params.pageSize, params.search] as const,
  },
} as const;
