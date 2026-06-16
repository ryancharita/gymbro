import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { createAuthenticatedClient } from "../../src/lib/auth";
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color="#f97316" style={styles.loader} />
      ) : (
        <FlatList
          style={styles.list}
          data={routines}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              {activeSession ? (
                <View style={styles.activeCard}>
                  <Text style={styles.activeTitle}>Active session</Text>
                  <Text style={styles.activeBody}>
                    {activeSession.routine?.name ?? "Workout"} in progress
                  </Text>
                  <Button
                    label="Resume session"
                    onPress={() => router.push(`/workouts/session/${activeSession.id}`)}
                  />
                </View>
              ) : null}

              <Text style={styles.sectionTitle}>Start new session</Text>

              {splits.length > 0 ? (
                <View style={styles.fromSplitCard}>
                  <Text style={styles.fromSplitTitle}>From your splits</Text>
                  {splits.slice(0, 3).map((split) => (
                    <View key={split.id} style={styles.splitBlock}>
                      <Text style={styles.splitName}>{split.name}</Text>
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
                <Text style={styles.empty}>No sessions logged yet.</Text>
              ) : (
                sessions.map((session) => (
                  <View key={session.id} style={styles.recentCard}>
                    <Text style={styles.recentName}>
                      {session.routine?.name ?? "Workout"} · {session.status}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {Math.round(session.totalVolumeKg)} kg volume ·{" "}
                      {Math.round(session.durationSeconds / 60)} min
                    </Text>
                  </View>
                ))
              )}
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.routineCard}>
              <Text style={styles.routineName}>{item.name}</Text>
              <Text style={styles.routineMeta}>{item.exercises.length} exercises</Text>
              <Button
                label="Start session"
                onPress={() => void startSession(item.id)}
                disabled={!!activeSession}
              />
            </View>
          )}
        />
      )}
      <Button label="Back" variant="ghost" onPress={() => router.back()} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  loader: { marginTop: 24 },
  error: { color: "#ef4444", marginBottom: 10 },
  sectionTitle: {
    color: "#d4d4d4",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 8,
    textTransform: "uppercase",
  },
  activeCard: {
    backgroundColor: "#1a1a1a",
    borderColor: "#f97316",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  fromSplitCard: {
    backgroundColor: "#151515",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 12,
    marginBottom: 12,
  },
  fromSplitTitle: { color: "#d4d4d4", fontWeight: "600", marginBottom: 8 },
  splitBlock: { marginBottom: 8 },
  splitName: { color: "#a3a3a3", marginBottom: 6 },
  activeTitle: { color: "#f97316", fontWeight: "700", marginBottom: 4 },
  activeBody: { color: "#fff", marginBottom: 10 },
  routineCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 14,
    marginBottom: 10,
  },
  routineName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  routineMeta: { color: "#a3a3a3", marginBottom: 8 },
  recentCard: {
    backgroundColor: "#151515",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222",
    padding: 12,
    marginBottom: 8,
  },
  recentName: { color: "#d4d4d4", marginBottom: 4 },
  recentMeta: { color: "#737373", fontSize: 13 },
  empty: { color: "#737373", marginBottom: 12 },
});
