import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useRef, useState } from "react";
import { createAuthenticatedClient } from "../lib/auth";
import { ME_QUERY, type AppUser } from "../lib/graphql";

export function useAppUser() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const refresh = useCallback(async (silent = false) => {
    if (!isSignedIn) {
      setUser(null);
      setLoading(false);
      return;
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      const data = await client.request<{ me: AppUser | null }>(ME_QUERY);
      setUser(data.me);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
      setUser(null);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh();
  }, [isLoaded, isSignedIn, refresh]);

  return { user, loading: !isLoaded || loading, error, refresh };
}
