import { QueryClient } from "@tanstack/react-query";
import { useAuthStore, isCurrentUserBanned } from "@/stores";

const BAN_CHECK_THROTTLE_MS = 2000;
let lastBanCheck = 0;

async function checkBanAndLogout(): Promise<void> {
  if (!useAuthStore.getState().user) return;
  const now = Date.now();
  if (now - lastBanCheck < BAN_CHECK_THROTTLE_MS) return;
  lastBanCheck = now;
  if (await isCurrentUserBanned()) {
    useAuthStore.getState().logout();
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

// RLS denies by returning empty data (200 + []), not an error. So we check on success too:
// any finished query/mutation triggers the check; if user is banned we logout.
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === "updated" && event.query.state.status === "success") {
    checkBanAndLogout();
  }
});
queryClient.getMutationCache().subscribe((event) => {
  if (event?.type === "updated" && event.mutation.state.status === "success") {
    checkBanAndLogout();
  }
});
// Also on error (e.g. .single() with 0 rows can throw)
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === "updated" && event.query.state.status === "error") {
    checkBanAndLogout();
  }
});
queryClient.getMutationCache().subscribe((event) => {
  if (event?.type === "updated" && event.mutation.state.status === "error") {
    checkBanAndLogout();
  }
});
