import { useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, Vibration, View } from "react-native";
import { Button } from "../../../src/components/Button";
import { FormField } from "../../../src/components/FormField";
import { ScreenLayout } from "../../../src/components/ScreenLayout";
import { createAuthenticatedClient } from "../../../src/lib/auth";
import {
  ABANDON_WORKOUT_SESSION_MUTATION,
  COMPLETE_WORKOUT_SESSION_MUTATION,
  LOG_WORKOUT_SET_MUTATION,
  WORKOUT_SESSION_QUERY,
  type WorkoutSession,
} from "../../../src/lib/graphql";

const DEFAULT_REST_SECONDS = 90;

export default function ActiveWorkoutSessionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>({});
  const [repsDrafts, setRepsDrafts] = useState<Record<string, string>>({});
  const [setNotesDrafts, setSetNotesDrafts] = useState<Record<string, string>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id || !isLoaded || !isSignedIn) return;
      setLoading(true);
      try {
        const client = await createAuthenticatedClient(getTokenRef.current);
        const data = await client.request<{ workoutSession: WorkoutSession | null }>(
          WORKOUT_SESSION_QUERY,
          { id },
        );
        setSession(data.workoutSession);
        setSessionNotes(data.workoutSession?.notes ?? "");
        if (data.workoutSession) {
          const nextWeightDrafts: Record<string, string> = {};
          const nextRepsDrafts: Record<string, string> = {};
          const nextSetNotesDrafts: Record<string, string> = {};
          for (const set of data.workoutSession.sets) {
            nextWeightDrafts[set.id] = set.weight?.toString() ?? "";
            nextRepsDrafts[set.id] = set.reps?.toString() ?? "";
            nextSetNotesDrafts[set.id] = set.notes ?? "";
          }
          setWeightDrafts(nextWeightDrafts);
          setRepsDrafts(nextRepsDrafts);
          setSetNotesDrafts(nextSetNotesDrafts);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, isLoaded, isSignedIn]);

  useEffect(() => {
    if (restSecondsLeft <= 0) return;
    timerRef.current = setTimeout(() => {
      setRestSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [restSecondsLeft]);

  useEffect(() => {
    if (restSecondsLeft === 0) {
      Vibration.vibrate(250);
    }
  }, [restSecondsLeft]);

  const grouped = useMemo(() => {
    if (!session) return [];
    const byExercise = new Map<string, typeof session.sets>();
    for (const set of session.sets) {
      const key = set.exerciseId;
      const list = byExercise.get(key) ?? [];
      list.push(set);
      byExercise.set(key, list);
    }
    return Array.from(byExercise.values());
  }, [session]);

  const patchSet = async (
    setId: string,
    patch: {
      weight?: number | null;
      reps?: number | null;
      durationSec?: number | null;
      notes?: string | null;
      isCompleted?: boolean;
    },
  ) => {
    if (!session) return;
    const client = await createAuthenticatedClient(getTokenRef.current);
    await client.request(LOG_WORKOUT_SET_MUTATION, { input: { setId, ...patch } });
    setSession((current) =>
      current
        ? {
            ...current,
            sets: current.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
          }
        : current,
    );
  };

  const completeSession = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      await client.request(COMPLETE_WORKOUT_SESSION_MUTATION, {
        id: session.id,
        notes: sessionNotes.trim() || undefined,
      });
      Alert.alert("Workout saved", "Session completed.");
      router.replace("/workouts");
    } catch (err) {
      Alert.alert("Could not complete session", err instanceof Error ? err.message : "Try again.");
    } finally {
      setSaving(false);
    }
  };

  const abandonSession = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      await client.request(ABANDON_WORKOUT_SESSION_MUTATION, {
        id: session.id,
        notes: sessionNotes.trim() || undefined,
      });
      Alert.alert("Session ended", "Partial progress saved.");
      router.replace("/workouts");
    } catch (err) {
      Alert.alert("Could not end session", err instanceof Error ? err.message : "Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !session) {
    return (
      <ScreenLayout title="Active session" subtitle="Loading...">
        <View />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title={session.routine?.name ?? "Active session"}
      subtitle={`Volume: ${Math.round(session.totalVolumeKg)} kg`}
    >
      <ScrollView>
        {grouped.map((sets) => (
          <View key={sets[0].exerciseId} style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{sets[0].exercise.name}</Text>
            {sets.map((set) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setLabel}>
                  Set {set.setNumber} {set.isCompleted ? "✓" : ""}
                </Text>
                <View style={styles.inline}>
                  <FormField
                    label="kg"
                    value={weightDrafts[set.id] ?? ""}
                    onChangeText={(v) =>
                      setWeightDrafts((current) => ({ ...current, [set.id]: v }))
                    }
                    keyboardType="decimal-pad"
                    style={styles.inlineField}
                  />
                  <FormField
                    label="reps"
                    value={repsDrafts[set.id] ?? ""}
                    onChangeText={(v) =>
                      setRepsDrafts((current) => ({ ...current, [set.id]: v }))
                    }
                    keyboardType="number-pad"
                    style={styles.inlineField}
                  />
                </View>
                <FormField
                  label="Set notes"
                  value={setNotesDrafts[set.id] ?? ""}
                  onChangeText={(v) =>
                    setSetNotesDrafts((current) => ({ ...current, [set.id]: v }))
                  }
                />
                <Button
                  label={set.isCompleted ? "Mark incomplete" : "Mark complete"}
                  onPress={async () => {
                    await patchSet(set.id, {
                      weight: (weightDrafts[set.id] ?? "")
                        ? Number.parseFloat(weightDrafts[set.id] ?? "") || null
                        : null,
                      reps: (repsDrafts[set.id] ?? "")
                        ? Number.parseInt(repsDrafts[set.id] ?? "", 10) || null
                        : null,
                      notes: (setNotesDrafts[set.id] ?? "").trim() || null,
                      isCompleted: !set.isCompleted,
                    });
                    if (!set.isCompleted) setRestSecondsLeft(DEFAULT_REST_SECONDS);
                  }}
                  variant={set.isCompleted ? "ghost" : "primary"}
                />
              </View>
            ))}
          </View>
        ))}

        <FormField
          label="Session notes"
          value={sessionNotes}
          onChangeText={setSessionNotes}
          multiline
          style={styles.notes}
        />

        {restSecondsLeft > 0 ? (
          <Text style={styles.timerText}>Rest timer: {restSecondsLeft}s</Text>
        ) : null}
        <Button label={saving ? "Saving..." : "Complete workout"} onPress={() => void completeSession()} />
        <Button
          label="End early (save partial)"
          variant="ghost"
          onPress={() => void abandonSession()}
          disabled={saving}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  exerciseCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 14,
    marginBottom: 12,
  },
  exerciseName: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 8 },
  setRow: {
    borderTopWidth: 1,
    borderTopColor: "#262626",
    paddingTop: 10,
    marginTop: 10,
  },
  setLabel: { color: "#d4d4d4", marginBottom: 8 },
  inline: { flexDirection: "row", gap: 8 },
  inlineField: { flex: 1 },
  notes: { minHeight: 80, textAlignVertical: "top" },
  timerText: { color: "#f97316", fontWeight: "700", marginBottom: 12, fontSize: 16 },
});
