import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useRef, useState } from "react";
import { createAuthenticatedClient } from "../lib/auth";
import {
  DISCOVER_USERS_QUERY,
  FOLLOW_USER_MUTATION,
  MY_FOLLOWING_QUERY,
  type AppUser,
} from "../lib/graphql";
import { type DiscoverBuddy } from "../lib/week-plan";

function toDiscoverBuddy(user: AppUser, isFollowing: boolean): DiscoverBuddy {
  const tags = [...user.trainingStyleTags, ...user.goals].filter(Boolean).slice(0, 3);
  return {
    id: user.id,
    name: user.username ?? "Athlete",
    gym: user.gymName ?? "Gym not set",
    distance: user.city ? user.city : null,
    rating: null,
    tags: tags.length > 0 ? tags : ["Open to train"],
    status: isFollowing ? "Connected" : "Available",
    isFollowing,
  };
}

export function useDiscover(search: string, activeFilter: string, userGymName?: string | null) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [loading, setLoading] = useState(true);
  const [buddies, setBuddies] = useState<DiscoverBuddy[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setBuddies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      const [discoverData, followingData] = await Promise.all([
        client.request<{ discoverUsers: AppUser[] }>(DISCOVER_USERS_QUERY, {
          search: search.trim() || undefined,
          limit: 30,
          offset: 0,
        }),
        client.request<{ myFollowing: AppUser[] }>(MY_FOLLOWING_QUERY),
      ]);

      const followingIds = new Set(followingData.myFollowing.map((user) => user.id));
      let results = discoverData.discoverUsers.map((user) => toDiscoverBuddy(user, followingIds.has(user.id)));

      if (activeFilter === "Same Gym" && userGymName) {
        results = results.filter(
          (buddy) => buddy.gym.toLowerCase() === userGymName.toLowerCase(),
        );
      } else if (activeFilter !== "All" && activeFilter !== "Nearby") {
        const needle = activeFilter.toLowerCase();
        results = results.filter((buddy) =>
          buddy.tags.some((tag) => tag.toLowerCase().includes(needle)),
        );
      }

      setBuddies(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load athletes");
      setBuddies([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, isLoaded, isSignedIn, search, userGymName]);

  useEffect(() => {
    void load();
  }, [load]);

  const connect = async (userId: string) => {
    const client = await createAuthenticatedClient(getTokenRef.current);
    await client.request(FOLLOW_USER_MUTATION, { userId });
    await load();
  };

  return { buddies, loading, error, connect, refresh: load };
}
