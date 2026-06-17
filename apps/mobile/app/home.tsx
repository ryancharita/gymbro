import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { spacing, typography, uiPatterns } from "@ironlink/shared";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "../src/components/EmptyState";
import { ProgressBar } from "../src/components/ProgressBar";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { useAppUser } from "../src/hooks/useAppUser";
import { useProfileDashboard } from "../src/hooks/useProfileDashboard";
import { useTrainingPlan } from "../src/hooks/useTrainingPlan";
import { createAuthenticatedClient } from "../src/lib/auth";
import { START_WORKOUT_SESSION_MUTATION } from "../src/lib/graphql";
import { type DayStatus, type WeekDayPlan } from "../src/lib/week-plan";
import { useThemeColors } from "../src/lib/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const { user } = useAppUser();
  const { stats } = useProfileDashboard();
  const {
    activeSplit,
    splits,
    weekPlan,
    weekProgress,
    todayRoutineId,
    avgWeeklyVolume,
    activeSession,
    loading,
  } = useTrainingPlan();
  const colors = useThemeColors();

  const subtitle = activeSplit
    ? `${user?.gymName ? `${user.gymName} · ` : ""}${activeSplit.name} · ${activeSplit.daysPerWeek} Day Program`
    : user?.gymName
      ? `${user.gymName} · Create a split to get started`
      : "Create a split to get started";

  const startRoutine = async (routineId: string | null) => {
    if (!routineId) {
      router.push("/splits");
      return;
    }
    if (activeSession) {
      router.push(`/workouts/session/${activeSession.id}`);
      return;
    }
    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      const data = await client.request<{ startWorkoutSession: { id: string } }>(
        START_WORKOUT_SESSION_MUTATION,
        { routineId },
      );
      router.push(`/workouts/session/${data.startWorkoutSession.id}`);
    } catch (err) {
      Alert.alert("Could not start workout", err instanceof Error ? err.message : "Try again.");
    }
  };

  return (
    <ScreenLayout title="Your Split" subtitle={subtitle} withBottomNav>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {loading ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>This Week</Text>
        </View>
        {weekProgress.total > 0 ? (
          <ProgressBar
            completed={weekProgress.completed}
            total={weekProgress.total}
            label="Week progress"
          />
        ) : null}

        {weekPlan.length > 0 ? (
          <View style={styles.dayList}>
            {weekPlan.map((day) => (
              <DayCard
                key={day.id}
                day={day}
                onStart={() => void startRoutine(day.routineId ?? todayRoutineId)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="📅"
            title="No active split"
            subtitle="Create or publish a split to see your weekly plan."
          />
        )}

        <View style={styles.statsRow}>
          <MetricCard
            icon="trending-up"
            value={String(stats?.currentStreakDays ?? 0)}
            label="Week Streak"
          />
          <MetricCard icon="barbell" value={String(stats?.totalWorkouts ?? 0)} label="Workouts" />
          <MetricCard icon="flash" value={String(avgWeeklyVolume)} label="Avg kg" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Splits</Text>
          <Pressable onPress={() => router.push("/splits")}>
            <Text style={[styles.linkLabel, { color: colors.accent }]}>Edit Split</Text>
          </Pressable>
        </View>
        <View style={styles.grid}>
          {splits.length > 0 ? (
            splits.slice(0, 2).map((split) => (
              <ActionCard
                key={split.id}
                title={split.name}
                description={`${split.daysPerWeek} days/week · ${split.difficulty.toLowerCase()}`}
                onPress={() => router.push("/splits")}
              />
            ))
          ) : (
            <ActionCard
              title="Create your first split"
              description="Build a weekly program from your routines"
              onPress={() => router.push("/splits/create")}
            />
          )}
          <ActionCard
            title="Create Custom Split"
            description="Design your own program"
            danger
            onPress={() => router.push("/splits/create")}
          />
        </View>

        <ActiveBuddiesSection />

        <View style={styles.quickActions}>
          <QuickAction
            icon="add-circle-outline"
            label="Log Workout"
            onPress={() => void startRoutine(todayRoutineId)}
          />
          <QuickAction icon="timer-outline" label="Workouts" onPress={() => router.push("/workouts")} />
        </View>
      </ScrollView>
    </ScreenLayout>
  );

  function ActiveBuddiesSection() {
    const { following } = useProfileDashboard();
    const buddies = following.slice(0, 2);

    return (
      <>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Active Buddies</Text>
          <Pressable onPress={() => router.push("/feed")}>
            <Text style={[styles.linkLabel, { color: colors.accent }]}>See All</Text>
          </Pressable>
        </View>
        <View style={styles.grid}>
          {buddies.length > 0 ? (
            buddies.map((buddy) => (
              <BuddyRow
                key={buddy.id}
                name={buddy.username ?? "Athlete"}
                status={buddy.gymName ? `Trains at ${buddy.gymName}` : "Training partner"}
                onJoin={() => router.push(`/profile/${buddy.id}`)}
              />
            ))
          ) : (
            <EmptyState
              icon="🤝"
              title="No buddies yet"
              subtitle="Discover athletes to train with on the Discover tab."
            />
          )}
        </View>
      </>
    );
  }

  function DayCard({ day, onStart }: { day: WeekDayPlan; onStart: () => void }) {
    const isToday = day.status === "today";
    const isCompleted = day.status === "completed";
    const isRest = day.status === "rest";

    return (
      <View
        style={[
          styles.dayCard,
          {
            backgroundColor: isToday ? colors.accent : colors.surface,
            borderColor: isToday ? colors.accent : colors.border,
          },
        ]}
      >
        <View style={styles.dayRow}>
          <View style={styles.dayMeta}>
            <View style={styles.dayLabelRow}>
              <Text
                style={[
                  styles.dayLabel,
                  { color: isToday ? colors.accentText : colors.textMuted },
                ]}
              >
                {day.label}
              </Text>
              {isToday ? (
                <View style={[styles.todayBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <Text style={[styles.todayBadgeText, { color: colors.accentText }]}>Today</Text>
                </View>
              ) : null}
              {isCompleted ? (
                <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
              ) : null}
            </View>
            <Text
              style={[
                styles.dayTitle,
                { color: isToday ? colors.accentText : colors.textPrimary },
              ]}
            >
              {day.title}
            </Text>
            {!isRest && day.muscles.length > 0 ? (
              <View style={styles.chipRow}>
                {day.muscles.map((muscle) => (
                  <View
                    key={muscle}
                    style={[
                      styles.muscleChip,
                      {
                        backgroundColor: isToday ? "rgba(255,255,255,0.15)" : colors.surfaceElevated,
                        borderColor: isToday ? "rgba(255,255,255,0.2)" : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.muscleChipText,
                        { color: isToday ? colors.accentText : colors.textMuted },
                      ]}
                    >
                      {muscle}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
          {statusIcon(day.status)}
        </View>
        {isToday ? (
          <Pressable
            accessibilityRole="button"
            onPress={onStart}
            style={({ pressed }) => [
              styles.startCta,
              { backgroundColor: pressed ? "rgba(255,255,255,0.85)" : colors.accentText },
            ]}
          >
            <Text style={[styles.startCtaText, { color: colors.accent }]}>Start Workout</Text>
          </Pressable>
        ) : null}
      </View>
    );

    function statusIcon(status: DayStatus) {
      if (status === "completed") return null;
      if (status === "rest") {
        return <Ionicons name="bed-outline" size={20} color={colors.textMuted} />;
      }
      return <Ionicons name="chevron-forward" size={18} color={isToday ? colors.accentText : colors.textMuted} />;
    }
  }

  function ActionCard({
    title,
    description,
    danger = false,
    onPress,
  }: {
    title: string;
    description: string;
    danger?: boolean;
    onPress: () => void;
  }) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.actionCard,
          {
            backgroundColor: colors.surface,
            borderColor: danger ? colors.accent : colors.border,
          },
          pressed ? { backgroundColor: colors.surfaceElevated } : null,
        ]}
      >
        <View style={styles.actionHeader}>
          <Text style={[styles.actionTitle, { color: danger ? colors.accent : colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.trailing, { color: colors.accent }]}>+</Text>
        </View>
        <Text style={[styles.actionBody, { color: colors.textSecondary }]}>{description}</Text>
      </Pressable>
    );
  }

  function MetricCard({
    icon,
    value,
    label,
  }: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    value: string;
    label: string;
  }) {
    return (
      <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.metricIconWrap, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name={icon} size={16} color={colors.accent} />
        </View>
        <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
      </View>
    );
  }

  function BuddyRow({
    name,
    status,
    onJoin,
  }: {
    name: string;
    status: string;
    onJoin: () => void;
  }) {
    return (
      <View style={[styles.buddyRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]} />
        <View style={styles.buddyText}>
          <Text style={[styles.buddyName, { color: colors.textPrimary }]}>{name}</Text>
          <Text style={[styles.buddyStatus, { color: colors.textMuted }]}>{status}</Text>
        </View>
        <Pressable
          onPress={onJoin}
          style={({ pressed }) => [
            styles.joinBtn,
            { borderColor: colors.border, backgroundColor: pressed ? colors.surfaceElevated : "transparent" },
          ]}
        >
          <Text style={[styles.joinBtnText, { color: colors.accent }]}>Join</Text>
        </Pressable>
      </View>
    );
  }

  function QuickAction({
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
          styles.quickAction,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed ? { backgroundColor: colors.surfaceElevated } : null,
        ]}
      >
        <Ionicons name={icon} size={22} color={colors.accent} />
        <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{label}</Text>
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.md,
  },
  loader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
    fontSize: 18,
    lineHeight: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  linkLabel: {
    ...typography.label,
  },
  dayList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dayCard: {
    ...uiPatterns.card,
    gap: spacing.sm,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  dayMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  dayLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dayLabel: {
    ...typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  todayBadge: {
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  todayBadgeText: {
    ...typography.caption,
    fontWeight: "700",
  },
  dayTitle: {
    ...typography.label,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  muscleChip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  muscleChipText: {
    ...typography.caption,
    fontSize: 11,
  },
  startCta: {
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  startCtaText: {
    ...typography.label,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricCard: {
    ...uiPatterns.card,
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    ...typography.heading,
    fontSize: 20,
    lineHeight: 24,
  },
  metricLabel: {
    ...typography.caption,
    textAlign: "center",
  },
  grid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionCard: {
    ...uiPatterns.card,
    minHeight: 88,
    justifyContent: "center",
    gap: spacing.xs,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  actionTitle: {
    ...typography.label,
  },
  trailing: {
    ...typography.heading,
    lineHeight: 20,
  },
  actionBody: {
    ...typography.caption,
  },
  buddyRow: {
    ...uiPatterns.card,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  buddyText: {
    flex: 1,
  },
  buddyName: {
    ...typography.label,
    marginBottom: 2,
  },
  buddyStatus: {
    ...typography.caption,
  },
  joinBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  joinBtnText: {
    ...typography.caption,
    fontWeight: "700",
  },
  quickActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickAction: {
    ...uiPatterns.card,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  quickActionLabel: {
    ...typography.label,
  },
});
