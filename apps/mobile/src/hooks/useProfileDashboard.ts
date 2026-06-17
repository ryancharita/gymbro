import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { createAuthenticatedClient } from "../lib/auth";
import {
  MY_FOLLOWING_QUERY,
  PROFILE_QUERY,
  PROGRESS_OVERVIEW_QUERY,
  type AppUser,
  type ProgressOverview,
  type UserStats,
} from "../lib/graphql";
import { useAppUser } from "./useAppUser";

type ProfileDashboard = {
  stats: UserStats | null;
  progress: ProgressOverview | null;
  following: AppUser[];
};

export function useProfileDashboard() {
  const { user } = useAppUser();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileDashboard>({
    stats: null,
    progress: null,
    following: [],
  });

  const refresh = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      const [profileData, progressData, followingData] = await Promise.all([
        client.request<{ profile: { stats: UserStats } | null }>(PROFILE_QUERY, { userId: user.id }),
        client.request<{ progressOverview: ProgressOverview }>(PROGRESS_OVERVIEW_QUERY, {
          period: "MONTHLY",
        }),
        client.request<{ myFollowing: AppUser[] }>(MY_FOLLOWING_QUERY),
      ]);

      setData({
        stats: profileData.profile?.stats ?? null,
        progress: progressData.progressOverview,
        following: followingData.myFollowing,
      });
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { ...data, user, loading, refresh };
}
