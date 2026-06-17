import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { spacing, typography, uiPatterns } from "@ironlink/shared";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar } from "../../src/components/ProgressBar";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { useProfileDashboard } from "../../src/hooks/useProfileDashboard";
import { useThemeColors } from "../../src/lib/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user, stats, progress, loading } = useProfileDashboard();
  const colors = useThemeColors();

  const displayName = user?.username ?? "Athlete";
  const initials = displayName.slice(0, 2).toUpperCase();

  const statCards = [
    { label: "Workouts", value: String(stats?.totalWorkouts ?? 0) },
    { label: "Streak", value: `${stats?.currentStreakDays ?? 0}d` },
    {
      label: "Volume",
      value: formatVolume(progress?.sessionVolumeTrend.reduce((sum, point) => sum + point.value, 0) ?? 0),
    },
    { label: "PRs", value: String(progress?.totalPrs ?? 0) },
  ];

  const achievements = buildAchievements(stats, progress);
  const goals = buildGoals(user?.goals ?? [], stats, progress);

  return (
    <ScreenLayout title="Profile" subtitle="Your training identity." withBottomNav>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {loading ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}
        <View style={styles.header}>
          <View style={[styles.avatarRing, { borderColor: colors.accent }]}>
            <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.avatarText, { color: colors.textPrimary }]}>{initials}</Text>
            </View>
          </View>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.bio, { color: colors.textMuted }]}>
            {user?.bio ?? "Push/Pull/Legs · Morning lifter"}
          </Text>
          {user?.gymName ? (
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {user.gymName}
              {user.city ? ` · ${user.city}` : ""}
            </Text>
          ) : null}
        </View>

        <View style={styles.statsGrid}>
          {statCards.map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Achievements</Text>
        <View style={styles.achievementList}>
          {achievements.length > 0 ? (
            achievements.map((item) => (
              <View
                key={item.title}
                style={[styles.achievementCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.achievementIcon, { backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name={item.icon} size={18} color={colors.accent} />
                </View>
                <View>
                  <Text style={[styles.achievementTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.achievementSub, { color: colors.textMuted }]}>{item.subtitle}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Log workouts to unlock achievements.
            </Text>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Goals</Text>
        <View style={styles.goalList}>
          {goals.length > 0 ? (
            goals.map((goal) => (
              <View
                key={goal.title}
                style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.goalTitle, { color: colors.textPrimary }]}>{goal.title}</Text>
                <ProgressBar completed={goal.current} total={goal.target} />
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Add goals during onboarding or in settings.
            </Text>
          )}
        </View>

        <View style={styles.links}>
          <SettingsLink
            icon="settings-outline"
            label="Account settings"
            onPress={() => router.push("/settings")}
            colors={colors}
          />
          <SettingsLink
            icon="analytics-outline"
            label="Progress & analytics"
            onPress={() => router.push("/progress")}
            colors={colors}
          />
          {user?.id ? (
            <SettingsLink
              icon="person-outline"
              label="Public profile"
              onPress={() => router.push(`/profile/${user.id}`)}
              colors={colors}
            />
          ) : null}
          <SettingsLink
            icon="log-out-outline"
            label="Sign out"
            onPress={() => {
              void signOut().then(() => router.replace("/sign-in"));
            }}
            colors={colors}
            destructive
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

function formatVolume(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
}

function buildAchievements(
  stats: { totalWorkouts: number; currentStreakDays: number } | null,
  progress: { totalPrs: number; totalSessions: number } | null,
) {
  const items: Array<{ icon: "flame" | "trophy" | "barbell"; title: string; subtitle: string }> = [];
  if ((stats?.currentStreakDays ?? 0) >= 3) {
    items.push({
      icon: "flame",
      title: "Week Warrior",
      subtitle: `${stats?.currentStreakDays ?? 0}-day streak`,
    });
  }
  if ((stats?.totalWorkouts ?? 0) >= 10) {
    items.push({
      icon: "trophy",
      title: "Consistent Lifter",
      subtitle: `${stats?.totalWorkouts ?? 0} workouts logged`,
    });
  }
  if ((progress?.totalPrs ?? 0) >= 1) {
    items.push({
      icon: "barbell",
      title: "PR Hunter",
      subtitle: `${progress?.totalPrs ?? 0} personal records`,
    });
  }
  return items;
}

function buildGoals(
  onboardingGoals: string[],
  stats: { totalWorkouts: number } | null,
  progress: { totalSessions: number } | null,
) {
  const sessionTarget = 12;
  const derived = [
    {
      title: `${sessionTarget} workouts this month`,
      current: progress?.totalSessions ?? 0,
      target: sessionTarget,
    },
  ];

  const tagged = onboardingGoals.slice(0, 2).map((goal) => ({
    title: goal,
    current: Math.min(stats?.totalWorkouts ?? 0, 10),
    target: 10,
  }));

  return [...tagged, ...derived];
}

function SettingsLink({
  icon,
  label,
  onPress,
  colors,
  destructive = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  destructive?: boolean;
}) {
  const accent = destructive ? colors.danger : colors.accent;
  const labelColor = destructive ? colors.danger : colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.linkRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed ? { backgroundColor: colors.surfaceElevated } : null,
      ]}
    >
      <Ionicons name={icon} size={20} color={accent} />
      <Text style={[styles.linkLabel, { color: labelColor }]}>{label}</Text>
      {!destructive ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.md },
  loader: { marginBottom: spacing.md },
  header: {
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  avatarRing: {
    borderWidth: 3,
    borderRadius: 48,
    padding: 3,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...typography.heading,
    fontSize: 28,
  },
  name: {
    ...typography.heading,
    fontSize: 24,
  },
  bio: {
    ...typography.body,
    textAlign: "center",
  },
  meta: {
    ...typography.caption,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    ...uiPatterns.card,
    width: "48%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  statValue: {
    ...typography.heading,
    fontSize: 20,
  },
  statLabel: {
    ...typography.caption,
  },
  sectionTitle: {
    ...typography.heading,
    fontSize: 18,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  achievementList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  achievementCard: {
    ...uiPatterns.card,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementTitle: {
    ...typography.label,
  },
  achievementSub: {
    ...typography.caption,
    marginTop: 2,
  },
  goalList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  goalCard: {
    ...uiPatterns.card,
    gap: spacing.sm,
  },
  goalTitle: {
    ...typography.label,
  },
  links: {
    gap: spacing.sm,
  },
  linkRow: {
    ...uiPatterns.card,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  linkLabel: {
    ...typography.label,
    flex: 1,
  },
  emptyText: {
    ...typography.body,
    marginBottom: spacing.md,
  },
});
