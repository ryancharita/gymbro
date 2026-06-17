import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { spacing, typography, uiPatterns } from "@ironlink/shared";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../src/components/Button";
import { ProgressBar } from "../../src/components/ProgressBar";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { createAuthenticatedClient } from "../../src/lib/auth";
import {
  MOCK_WORKOUT_DAYS,
  type WorkoutDayPlan,
  type WorkoutExercise,
} from "../../src/lib/mock-week-plan";
import { useThemeColors } from "../../src/lib/theme";
import {
  ACTIVE_WORKOUT_SESSION_QUERY,
  START_WORKOUT_SESSION_MUTATION,
  MY_ROUTINES_QUERY,
  type Routine,
  type WorkoutSession,
} from "../../src/lib/graphql";

export default function WorkoutsScreen() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [expandedDayId, setExpandedDayId] = useState<string | null>("wed");
  const colors = useThemeColors();

  const completedDays = MOCK_WORKOUT_DAYS.filter((d) => d.status === "completed").length;

  const load = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      const [activeData, routineData] = await Promise.all([
        client.request<{ activeWorkoutSession: WorkoutSession | null }>(
          ACTIVE_WORKOUT_SESSION_QUERY,
        ),
        client.request<{ myRoutines: Routine[] }>(MY_ROUTINES_QUERY),
      ]);
      setActiveSession(activeData.activeWorkoutSession);
      setRoutines(routineData.myRoutines);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const startSession = async () => {
    const routine = routines[0];
    if (!routine) {
      Alert.alert("No routines", "Create a routine first to start logging.");
      router.push("/routines");
      return;
    }
    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      const data = await client.request<{ startWorkoutSession: WorkoutSession }>(
        START_WORKOUT_SESSION_MUTATION,
        { routineId: routine.id },
      );
      router.push(`/workouts/session/${data.startWorkoutSession.id}`);
    } catch (err) {
      Alert.alert("Could not start session", err instanceof Error ? err.message : "Try again.");
    }
  };

  return (
    <ScreenLayout
      title="Workouts"
      subtitle="Your weekly plan and exercise log."
      withBottomNav
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {activeSession ? (
            <View style={[styles.activeCard, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
              <Text style={[styles.activeTitle, { color: colors.accentText }]}>Active session</Text>
              <Text style={[styles.activeBody, { color: colors.accentText }]}>
                {activeSession.routine?.name ?? "Workout"} in progress
              </Text>
              <Pressable
                onPress={() => router.push(`/workouts/session/${activeSession.id}`)}
                style={({ pressed }) => [
                  styles.resumeBtn,
                  { backgroundColor: pressed ? "rgba(255,255,255,0.85)" : colors.accentText },
                ]}
              >
                <Text style={[styles.resumeBtnText, { color: colors.accent }]}>Resume session</Text>
              </Pressable>
            </View>
          ) : null}

          <ProgressBar completed={completedDays} total={MOCK_WORKOUT_DAYS.length} label="This week" />

          <View style={styles.dayList}>
            {MOCK_WORKOUT_DAYS.map((day) => (
              <WorkoutDayCard
                key={day.id}
                day={day}
                expanded={expandedDayId === day.id}
                onToggle={() => setExpandedDayId((current) => (current === day.id ? null : day.id))}
              />
            ))}
          </View>

          <Button
            label="Quick Log Exercise"
            onPress={() => void startSession()}
            disabled={!!activeSession}
          />
        </ScrollView>
      )}
    </ScreenLayout>
  );

  function WorkoutDayCard({
    day,
    expanded,
    onToggle,
  }: {
    day: WorkoutDayPlan;
    expanded: boolean;
    onToggle: () => void;
  }) {
    const isToday = day.status === "today";
    const isCompleted = day.status === "completed";

    return (
      <View
        style={[
          styles.dayCard,
          {
            backgroundColor: colors.surface,
            borderColor: isToday ? colors.accent : colors.border,
          },
        ]}
      >
        <Pressable onPress={onToggle} style={styles.dayHeader}>
          <View style={styles.dayHeaderLeft}>
            <Text style={[styles.dayLabel, { color: colors.textMuted }]}>{day.label}</Text>
            <Text style={[styles.dayTitle, { color: colors.textPrimary }]}>{day.title}</Text>
          </View>
          <View style={styles.dayHeaderRight}>
            {isCompleted ? <Ionicons name="checkmark-circle" size={20} color={colors.accent} /> : null}
            {isToday ? (
              <View style={[styles.todayPill, { backgroundColor: colors.accent }]}>
                <Text style={[styles.todayPillText, { color: colors.accentText }]}>Today</Text>
              </View>
            ) : null}
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textMuted}
            />
          </View>
        </Pressable>

        {expanded ? (
          <View style={styles.exerciseList}>
            {day.exercises.map((exercise) => (
              <ExerciseRow key={exercise.id} exercise={exercise} />
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  function ExerciseRow({ exercise }: { exercise: WorkoutExercise }) {
    return (
      <View style={[styles.exerciseRow, { borderTopColor: colors.border }]}>
        <View style={styles.exerciseMeta}>
          <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>{exercise.name}</Text>
          <Text style={[styles.exerciseSets, { color: colors.textMuted }]}>
            {exercise.sets} × {exercise.reps}
            {exercise.weightKg > 0 ? ` @ ${exercise.weightKg} kg` : ""}
          </Text>
        </View>
        <View
          style={[
            styles.checkBox,
            {
              borderColor: exercise.done ? colors.accent : colors.border,
              backgroundColor: exercise.done ? colors.accent : "transparent",
            },
          ]}
        >
          {exercise.done ? <Ionicons name="checkmark" size={14} color={colors.accentText} /> : null}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  content: { paddingBottom: spacing.md },
  activeCard: {
    ...uiPatterns.card,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  activeTitle: { ...typography.label, fontWeight: "700" },
  activeBody: { ...typography.body, marginBottom: spacing.sm },
  resumeBtn: {
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  resumeBtnText: { ...typography.label, fontWeight: "700" },
  dayList: { gap: spacing.sm, marginBottom: spacing.lg },
  dayCard: {
    ...uiPatterns.card,
    padding: 0,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    gap: spacing.sm,
  },
  dayHeaderLeft: { flex: 1, gap: 2 },
  dayHeaderRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dayLabel: { ...typography.caption, textTransform: "uppercase", letterSpacing: 0.5 },
  dayTitle: { ...typography.label, fontSize: 16 },
  todayPill: {
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  todayPillText: { ...typography.caption, fontWeight: "700" },
  exerciseList: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  exerciseMeta: { flex: 1, gap: 2 },
  exerciseName: { ...typography.label },
  exerciseSets: { ...typography.caption },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
