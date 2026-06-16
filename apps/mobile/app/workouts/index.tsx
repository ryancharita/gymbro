import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { spacing, typography, uiPatterns } from "@ironlink/shared";
import { Button } from "../../src/components/Button";
import { EmptyState } from "../../src/components/EmptyState";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { createAuthenticatedClient } from "../../src/lib/auth";
import { useThemeColors } from "../../src/lib/theme";
import {
  ACTIVE_WORKOUT_SESSION_QUERY,
  MY_SPLITS_QUERY,
  MY_ROUTINES_QUERY,
  MY_WORKOUT_SESSIONS_QUERY,
  START_WORKOUT_SESSION_MUTATION,
  type Routine,
  type Split,
  type WorkoutSession,
} from "../../src/lib/graphql";

export default function WorkoutsScreen() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const colors = useThemeColors();

  const load = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      const [routineData, splitData, sessionData, activeData] = await Promise.all([
        client.request<{ myRoutines: Routine[] }>(MY_ROUTINES_QUERY),
        client.request<{ mySplits: Split[] }>(MY_SPLITS_QUERY),
        client.request<{ myWorkoutSessions: WorkoutSession[] }>(MY_WORKOUT_SESSIONS_QUERY, {
          limit: 10,
          offset: 0,
        }),
        client.request<{ activeWorkoutSession: WorkoutSession | null }>(
          ACTIVE_WORKOUT_SESSION_QUERY,
        ),
      ]);
      setRoutines(routineData.myRoutines);
      setSplits(splitData.mySplits);
      setSessions(sessionData.myWorkoutSessions);
      setActiveSession(activeData.activeWorkoutSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load workouts");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const startSession = async (routineId: string) => {
    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      const data = await client.request<{ startWorkoutSession: WorkoutSession }>(
        START_WORKOUT_SESSION_MUTATION,
        { routineId },
      );
      router.push(`/workouts/session/${data.startWorkoutSession.id}`);
    } catch (err) {
      Alert.alert("Could not start session", err instanceof Error ? err.message : "Try again.");
    }
  };

  return (
    <ScreenLayout
      title="Workout logging"
      subtitle="Start from a routine, log completed sets, and track total volume."
      withBottomNav
    >
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <FlatList
          style={styles.list}
          data={routines}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              {activeSession ? (
                <View style={[styles.activeCard, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                  <Text style={[styles.activeTitle, { color: colors.accentText }]}>Active session</Text>
                  <Text style={[styles.activeBody, { color: colors.accentText }]}>
                    {activeSession.routine?.name ?? "Workout"} in progress
                  </Text>
                  <Button
                    label="Resume session"
                    onPress={() => router.push(`/workouts/session/${activeSession.id}`)}
                    variant="secondary"
                  />
                </View>
              ) : null}

              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Start new session</Text>

              {splits.length > 0 ? (
                <View style={[styles.fromSplitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.fromSplitTitle, { color: colors.textPrimary }]}>From your splits</Text>
                  {splits.slice(0, 3).map((split) => (
                    <View key={split.id} style={styles.splitBlock}>
                      <Text style={[styles.splitName, { color: colors.textSecondary }]}>{split.name}</Text>
                      {split.days
                        .filter((day) => day.routine?.id)
                        .map((day) => (
                          <Button
                            key={day.id}
                            label={`${day.label}: ${day.routine?.name ?? "Routine"}`}
                            variant="ghost"
                            onPress={() => void startSession(day.routine!.id)}
                            disabled={!!activeSession}
                          />
                        ))}
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          }
          ListFooterComponent={
            <>
              <Text style={styles.sectionTitle}>Recent sessions</Text>
              {sessions.length === 0 ? (
                <EmptyState title="No sessions logged" subtitle="Start your first workout to build history." icon="◌" />
              ) : (
                sessions.map((session) => (
                  <View
                    key={session.id}
                    style={[styles.recentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Text style={[styles.recentName, { color: colors.textPrimary }]}>
                      {session.routine?.name ?? "Workout"} · {session.status}
                    </Text>
                    <Text style={[styles.recentMeta, { color: colors.textSecondary }]}>
                      {Math.round(session.totalVolumeKg)} kg volume ·{" "}
                      {Math.round(session.durationSeconds / 60)} min
                    </Text>
                  </View>
                ))
              )}
            </>
          }
          renderItem={({ item }) => (
            <View style={[styles.routineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.routineName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.routineMeta, { color: colors.textSecondary }]}>
                {item.exercises.length} exercises
              </Text>
              <Button
                label="Start session"
                onPress={() => void startSession(item.id)}
                disabled={!!activeSession}
              />
            </View>
          )}
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  loader: { marginTop: 24 },
  error: { marginBottom: 10 },
  sectionTitle: {
    ...typography.label,
    marginBottom: 10,
    marginTop: 8,
    textTransform: "uppercase",
  },
  activeCard: {
    borderColor: "#f97316",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  fromSplitCard: {
    ...uiPatterns.card,
    borderRadius: 12,
    marginBottom: 12,
  },
  fromSplitTitle: { ...typography.label, marginBottom: 8 },
  splitBlock: { marginBottom: 8 },
  splitName: { ...typography.caption, marginBottom: 6 },
  activeTitle: { ...typography.label, fontWeight: "700", marginBottom: 4 },
  activeBody: { ...typography.body, marginBottom: 10 },
  routineCard: {
    ...uiPatterns.card,
    borderRadius: 12,
    marginBottom: 10,
  },
  routineName: { ...typography.body, fontWeight: "700" },
  routineMeta: { ...typography.caption, marginBottom: 8 },
  recentCard: {
    ...uiPatterns.card,
    borderRadius: 10,
    marginBottom: 8,
  },
  recentName: { ...typography.label, marginBottom: 4 },
  recentMeta: { ...typography.caption },
});
