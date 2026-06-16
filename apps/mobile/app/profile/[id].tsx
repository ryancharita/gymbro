import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { useAppUser } from "../../src/hooks/useAppUser";
import { createAuthenticatedClient } from "../../src/lib/auth";
import {
  FOLLOW_USER_MUTATION,
  PROFILE_QUERY,
  UNFOLLOW_USER_MUTATION,
  type FeedPost,
  type Routine,
  type Split,
  type UserStats,
} from "../../src/lib/graphql";

type ProfileData = {
  user: {
    id: string;
    username: string | null;
    bio: string | null;
    city: string | null;
    gymName: string | null;
  };
  stats: UserStats;
  isFollowing: boolean;
  isRequested: boolean;
  sharedSplits: Split[];
  sharedRoutines: Routine[];
  progressPosts: FeedPost[];
};

export default function ProfileScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const profileId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user: me } = useAppUser();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [data, setData] = useState<ProfileData | null>(null);

  const loadProfile = useCallback(async () => {
    if (!profileId || !isLoaded || !isSignedIn) return;
    const client = await createAuthenticatedClient(getTokenRef.current);
    const response = await client.request<{ profile: ProfileData | null }>(PROFILE_QUERY, {
      userId: profileId,
    });
    setData(response.profile);
  }, [profileId, isLoaded, isSignedIn]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const isSelf = profileId === me?.id;

  const onFollowToggle = async () => {
    if (!profileId || isSelf) return;
    const client = await createAuthenticatedClient(getTokenRef.current);
    if (data?.isFollowing) {
      await client.request(UNFOLLOW_USER_MUTATION, { userId: profileId });
    } else {
      await client.request(FOLLOW_USER_MUTATION, { userId: profileId });
    }
    await loadProfile();
  };

  return (
    <ScreenLayout title={data?.user.username ?? "Profile"} subtitle={data?.user.bio ?? "Athlete profile"}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{data?.stats.totalWorkouts ?? 0} workouts</Text>
          <Text style={styles.stat}>{data?.stats.followersCount ?? 0} followers</Text>
          <Text style={styles.stat}>{data?.stats.followingCount ?? 0} following</Text>
          <Text style={styles.stat}>{data?.stats.currentStreakDays ?? 0} day streak</Text>
        </View>

        <Text style={styles.meta}>
          {[data?.user.city, data?.user.gymName].filter(Boolean).join(" · ") || "No location/gym set"}
        </Text>

        {!isSelf ? (
          <Button
            label={data?.isFollowing ? "Unfollow" : data?.isRequested ? "Requested" : "Follow"}
            onPress={() => void onFollowToggle()}
            disabled={!!data?.isRequested}
          />
        ) : null}

        <Text style={styles.section}>Shared splits</Text>
        {(data?.sharedSplits ?? []).map((split) => (
          <Text key={split.id} style={styles.item}>• {split.name}</Text>
        ))}

        <Text style={styles.section}>Shared routines</Text>
        {(data?.sharedRoutines ?? []).map((routine) => (
          <Text key={routine.id} style={styles.item}>• {routine.name}</Text>
        ))}

        <Text style={styles.section}>Progress posts</Text>
        {(data?.progressPosts ?? []).map((post) => (
          <View key={post.id} style={styles.postCard}>
            <Text style={styles.item}>{post.content}</Text>
            <Text style={styles.postMeta}>{new Date(post.createdAt).toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  stat: {
    color: "#e5e5e5",
    backgroundColor: "#171717",
    borderColor: "#262626",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  meta: { color: "#a3a3a3", marginBottom: 12 },
  section: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  item: { color: "#d4d4d4", marginBottom: 6 },
  postCard: {
    borderColor: "#262626",
    borderWidth: 1,
    backgroundColor: "#171717",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  postMeta: { color: "#a3a3a3", fontSize: 12, marginTop: 4 },
});
