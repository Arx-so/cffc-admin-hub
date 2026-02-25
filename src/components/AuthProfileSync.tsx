import { useProfileQuery } from "@/hooks/useProfileQuery";

/** Mount once in App so profile is fetched with useQuery and synced to auth store. */
export function AuthProfileSync() {
  useProfileQuery();
  return null;
}
