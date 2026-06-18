import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
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
import { EmptyState } from "../../src/components/EmptyState";
import { ProgressBar } from "../../src/components/ProgressBar";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { useTrainingPlan } from "../../src/hooks/useTrainingPlan";
import { createAuthenticatedClient } from "../../src/lib/auth";
import { START_WORKOUT_SESSION_MUTATION } from "../../src/lib/graphql";
import { type WorkoutDayPlan, type WorkoutExercise } from "../../src/lib/week-plan";
import { useThemeColors } from "../../src/lib/theme";

export default function WorkoutsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const {
    activeSession,
    workoutDays,
    weekProgress,
    todayRoutineId,
    loading,
    error,
  } = useTrainingPlan();
  const colors = useThemeColors();
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);

  const defaultExpanded =
    workoutDays.find((day) => day.status === "today")?.id ??
    workoutDays.find((day) => day.status === "upcoming")?.id ??
    workoutDays[0]?.id ??
    null;
  const expandedId = expandedDayId ?? defaultExpanded;

  const startSession = async (routineId?: string | null) => {
    const targetRoutineId = routineId ?? todayRoutineId;
    if (!targetRoutineId) {
      Alert.alert("No routine scheduled", "Assign routines to your split days first.");
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
        { routineId: targetRoutineId },
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
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
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

          {weekProgress.total > 0 ? (
            <ProgressBar
              completed={weekProgress.completed}
              total={weekProgress.total}
              label="This week"
            />
          ) : null}

          {workoutDays.length > 0 ? (
            <View style={styles.dayList}>
              {workoutDays.map((day) => (
                <WorkoutDayCard
                  key={day.id}
                  day={day}
                  expanded={expandedId === day.id}
                  onToggle={() => setExpandedDayId((current) => (current === day.id ? null : day.id))}
                  onStart={() => void startSession(day.routineId)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="🏋️"
              title="No workout plan yet"
              subtitle="Assign routines to your split days to see exercises here."
            />
          )}

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
    onStart,
  }: {
    day: WorkoutDayPlan;
    expanded: boolean;
    onToggle: () => void;
    onStart: () => void;
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
            {isToday ? (
              <Pressable
                onPress={onStart}
                style={({ pressed }) => [
                  styles.startBtn,
                  { backgroundColor: pressed ? colors.accentPressed : colors.accent },
                ]}
              >
                <Text style={[styles.startBtnText, { color: colors.accentText }]}>Start Workout</Text>
              </Pressable>
            ) : null}
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
  error: { marginBottom: spacing.sm },
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
  startBtn: {
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  startBtnText: { ...typography.label, fontWeight: "700" },
});
