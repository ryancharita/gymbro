import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { spacing, typography, uiPatterns } from "@ironlink/shared";
import { Button } from "../../src/components/Button";
import { EmptyState } from "../../src/components/EmptyState";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { useAppUser } from "../../src/hooks/useAppUser";
import { createAuthenticatedClient } from "../../src/lib/auth";
import { useThemeColors } from "../../src/lib/theme";
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
  const colors = useThemeColors();

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
    <ScreenLayout
      title={data?.user.username ?? "Profile"}
      subtitle={data?.user.bio ?? "Athlete profile"}
      withBottomNav
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <Text style={[styles.stat, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}>
            {data?.stats.totalWorkouts ?? 0} workouts
          </Text>
          <Text style={[styles.stat, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}>
            {data?.stats.followersCount ?? 0} followers
          </Text>
          <Text style={[styles.stat, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}>
            {data?.stats.followingCount ?? 0} following
          </Text>
          <Text style={[styles.stat, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}>
            {data?.stats.currentStreakDays ?? 0} day streak
          </Text>
        </View>

        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {[data?.user.city, data?.user.gymName].filter(Boolean).join(" · ") || "No location/gym set"}
        </Text>

        {!isSelf ? (
          <Button
            label={data?.isFollowing ? "Unfollow" : data?.isRequested ? "Requested" : "Follow"}
            onPress={() => void onFollowToggle()}
            disabled={!!data?.isRequested}
          />
        ) : null}

        <Text style={[styles.section, { color: colors.textPrimary }]}>Shared splits</Text>
        {(data?.sharedSplits ?? []).length === 0 ? (
          <EmptyState
            icon="🧩"
            title="No shared splits yet"
            subtitle="Published splits will appear here once this athlete shares one."
          />
        ) : (
          (data?.sharedSplits ?? []).map((split) => (
            <Text key={split.id} style={[styles.item, { color: colors.textSecondary }]}>
              • {split.name}
            </Text>
          ))
        )}

        <Text style={[styles.section, { color: colors.textPrimary }]}>Shared routines</Text>
        {(data?.sharedRoutines ?? []).length === 0 ? (
          <EmptyState
            icon="📋"
            title="No routines shared yet"
            subtitle="Routines will show up here when they're published."
          />
        ) : (
          (data?.sharedRoutines ?? []).map((routine) => (
            <Text key={routine.id} style={[styles.item, { color: colors.textSecondary }]}>
              • {routine.name}
            </Text>
          ))
        )}

        <Text style={[styles.section, { color: colors.textPrimary }]}>Progress posts</Text>
        {(data?.progressPosts ?? []).length === 0 ? (
          <EmptyState
            icon="📈"
            title="No progress posts yet"
            subtitle="Workout highlights and milestones will appear in this section."
          />
        ) : (
          (data?.progressPosts ?? []).map((post) => (
            <View
              key={post.id}
              style={[styles.postCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Text style={[styles.item, { color: colors.textSecondary }]}>{post.content}</Text>
              <Text style={[styles.postMeta, { color: colors.textMuted }]}>
                {new Date(post.createdAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  stat: {
    ...typography.caption,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
  },
  meta: { ...typography.body, marginBottom: spacing.md },
  section: { ...typography.heading, marginTop: spacing.lg, marginBottom: spacing.sm },
  item: { ...typography.body, marginBottom: spacing.xs + 2 },
  postCard: {
    ...uiPatterns.card,
    marginBottom: spacing.sm,
  },
  postMeta: { ...typography.caption, marginTop: spacing.xs },
});
