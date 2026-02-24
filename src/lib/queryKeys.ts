export const queryKeys = {
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
  },
} as const;
