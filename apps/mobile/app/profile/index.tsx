import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { spacing, typography, uiPatterns } from "@ironlink/shared";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar } from "../../src/components/ProgressBar";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { useAppUser } from "../../src/hooks/useAppUser";
import { useThemeColors } from "../../src/lib/theme";

const STATS = [
  { label: "Workouts", value: "48" },
  { label: "Streak", value: "6w" },
  { label: "Volume", value: "12.4k" },
  { label: "PRs", value: "7" },
] as const;

const ACHIEVEMENTS = [
  { icon: "flame" as const, title: "Week Warrior", subtitle: "6-week streak" },
  { icon: "trophy" as const, title: "Century Club", subtitle: "100+ workouts" },
  { icon: "barbell" as const, title: "Heavy Lifter", subtitle: "10k kg volume" },
] as const;

const GOALS = [
  { title: "Bench 100 kg", current: 92, target: 100 },
  { title: "12 workouts this month", current: 8, target: 12 },
  { title: "Log 10 leg days", current: 7, target: 10 },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAppUser();
  const colors = useThemeColors();

  const displayName = user?.username ?? "Athlete";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <ScreenLayout title="Profile" subtitle="Your training identity." withBottomNav>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
          {STATS.map((stat) => (
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
          {ACHIEVEMENTS.map((item) => (
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
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Goals</Text>
        <View style={styles.goalList}>
          {GOALS.map((goal) => (
            <View
              key={goal.title}
              style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.goalTitle, { color: colors.textPrimary }]}>{goal.title}</Text>
              <ProgressBar completed={goal.current} total={goal.target} />
            </View>
          ))}
        </View>

        <View style={styles.links}>
          <SettingsLink
            icon="settings-outline"
            label="Account settings"
            onPress={() => router.push("/settings")}
          />
          <SettingsLink
            icon="analytics-outline"
            label="Progress & analytics"
            onPress={() => router.push("/progress")}
          />
          {user?.id ? (
            <SettingsLink
              icon="person-outline"
              label="Public profile"
              onPress={() => router.push(`/profile/${user.id}`)}
            />
          ) : null}
        </View>
      </ScrollView>
    </ScreenLayout>
  );

  function SettingsLink({
    icon,
    label,
    onPress,
  }: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
    onPress: () => void;
  }) {
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
        <Ionicons name={icon} size={20} color={colors.accent} />
        <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.md },
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
});
