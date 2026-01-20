import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "~/lib/convex";

export function useSyncUser() {
  const syncedRef = useRef(false);

  const userWithAccounts = useQuery(api.auth.getCurrentUserWithAccounts);
  const syncUser = useMutation(api.users.getOrCreateFromBetterAuth);

  useEffect(() => {
    // Only sync once per session when we have auth user but no app user
    if (
      userWithAccounts?.authUser &&
      !userWithAccounts?.appUser &&
      !syncedRef.current
    ) {
      syncedRef.current = true;
      syncUser({
        betterAuthId: userWithAccounts.authUser.id,
        email: userWithAccounts.authUser.email,
        name: userWithAccounts.authUser.name || undefined,
        image: userWithAccounts.authUser.image || undefined,
      }).catch(console.error);
    }
  }, [userWithAccounts, syncUser]);

  return {
    isLoading: !userWithAccounts,
    appUser: userWithAccounts?.appUser,
    authUser: userWithAccounts?.authUser,
    hasGitHub: userWithAccounts?.hasGitHub ?? false,
    githubAccessToken: userWithAccounts?.githubAccessToken,
  };
}
