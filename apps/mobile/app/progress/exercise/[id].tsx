import { useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenLayout } from "../../../src/components/ScreenLayout";
import { createAuthenticatedClient } from "../../../src/lib/auth";
import { EXERCISE_PROGRESS_QUERY, type ExerciseProgressPoint } from "../../../src/lib/graphql";

export default function ExerciseProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [points, setPoints] = useState<ExerciseProgressPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id || !isLoaded || !isSignedIn) return;
      setLoading(true);
      try {
        const client = await createAuthenticatedClient(getTokenRef.current);
        const data = await client.request<{
          exerciseProgress: { points: ExerciseProgressPoint[] };
        }>(EXERCISE_PROGRESS_QUERY, { exerciseId: id, limit: 40 });
        setPoints(data.exerciseProgress.points);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, isLoaded, isSignedIn]);

  const maxOrm = Math.max(1, ...points.map((point) => point.oneRepMaxEstimate));

  return (
    <ScreenLayout title="Exercise progress" subtitle="Weight, reps, and estimated 1RM over time.">
      {loading ? (
        <ActivityIndicator color="#f97316" style={{ marginTop: 24 }} />
      ) : (
        <ScrollView>
          {points.map((point) => (
            <View key={`${point.date}-${point.oneRepMaxEstimate}`} style={styles.card}>
              <Text style={styles.date}>
                {point.date} {point.isPr ? "🏆 PR" : ""}
              </Text>
              <Text style={styles.meta}>
                {point.weight ?? 0} kg × {point.reps ?? 0} reps
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${(point.oneRepMaxEstimate / maxOrm) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.orm}>
                1RM est: {Math.round(point.oneRepMaxEstimate * 10) / 10} kg
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 12,
    marginBottom: 10,
  },
  date: { color: "#fff", fontWeight: "600", marginBottom: 4 },
  meta: { color: "#a3a3a3", marginBottom: 6 },
  track: { height: 10, borderRadius: 999, backgroundColor: "#262626", overflow: "hidden" },
  fill: { height: 10, backgroundColor: "#f97316" },
  orm: { color: "#d4d4d4", marginTop: 6 },
});
