import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useState } from "react";
import { createApiClient } from "../lib/api";
import { ME_QUERY, type AppUser } from "../lib/graphql";

export function useAppUser() {
  const { getToken, isSignedIn } = useAuth();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const client = createApiClient(token);
      const data = await client.request<{ me: AppUser | null }>(ME_QUERY);
      setUser(data.me);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { user, loading, error, refresh };
}
