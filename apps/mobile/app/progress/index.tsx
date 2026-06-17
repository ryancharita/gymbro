import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { Chip } from "../../src/components/Chip";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { createAuthenticatedClient } from "../../src/lib/auth";
import {
  MY_WORKOUT_SESSIONS_QUERY,
  PROGRESS_OVERVIEW_QUERY,
  type ProgressOverview,
  type WorkoutSession,
} from "../../src/lib/graphql";

export default function ProgressScreen() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [period, setPeriod] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    setLoading(true);
    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      const [overviewData, sessionData] = await Promise.all([
        client.request<{ progressOverview: ProgressOverview }>(PROGRESS_OVERVIEW_QUERY, {
          period,
        }),
        client.request<{ myWorkoutSessions: WorkoutSession[] }>(MY_WORKOUT_SESSIONS_QUERY, {
          limit: 20,
          offset: 0,
        }),
      ]);
      setOverview(overviewData.progressOverview);
      setSessions(sessionData.myWorkoutSessions);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, period]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const maxSessionVolume = Math.max(
    1,
    ...(overview?.sessionVolumeTrend.map((point) => point.value) ?? [1]),
  );

  return (
    <ScreenLayout
      title="Progress history"
      subtitle="Session trends, PR highlights, and exercise-level progress."
      withBottomNav
    >
      <View style={styles.row}>
        <Chip
          label="Weekly"
          selected={period === "WEEKLY"}
          onPress={() => setPeriod("WEEKLY")}
        />
        <Chip
          label="Monthly"
          selected={period === "MONTHLY"}
          onPress={() => setPeriod("MONTHLY")}
        />
        <Chip
          label="Line"
          selected={chartType === "line"}
          onPress={() => setChartType("line")}
        />
        <Chip
          label="Bar"
          selected={chartType === "bar"}
          onPress={() => setChartType("bar")}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#f97316" style={{ marginTop: 24 }} />
      ) : (
        <ScrollView>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryText}>Sessions: {overview?.totalSessions ?? 0}</Text>
            <Text style={styles.summaryText}>PRs hit: {overview?.totalPrs ?? 0} 🏆</Text>
          </View>

          <Text style={styles.sectionTitle}>Session volume trend ({chartType})</Text>
          <View style={styles.chartCard}>
            {(overview?.sessionVolumeTrend ?? []).map((point) => (
              <View key={point.date} style={styles.chartRow}>
                <Text style={styles.chartLabel}>{point.date.slice(5)}</Text>
                <View style={styles.chartTrack}>
                  <View
                    style={[
                      chartType === "bar" ? styles.bar : styles.linePoint,
                      { width: `${(point.value / maxSessionVolume) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.chartValue}>{Math.round(point.value)}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Muscle group volume</Text>
          <View style={styles.chartCard}>
            {(overview?.muscleGroupVolumeTrend ?? []).map((point) => (
              <View key={point.muscleGroup} style={styles.chartRow}>
                <Text style={styles.chartLabel}>{point.muscleGroup}</Text>
                <Text style={styles.chartValue}>{Math.round(point.value)} kg</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Session history</Text>
          {(sessions ?? []).map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>
                {session.routine?.name ?? "Workout"} {session.sets.some((set) => set.isPr) ? "🏆" : ""}
              </Text>
              <Text style={styles.sessionMeta}>
                {new Date(session.startedAt).toLocaleDateString()} · {Math.round(session.totalVolumeKg)} kg
              </Text>
              <Button
                label="View exercise progress"
                variant="ghost"
                onPress={() => {
                  const firstSet = session.sets.find((set) => set.exerciseId);
                  if (firstSet) {
                    router.push(`/progress/exercise/${firstSet.exerciseId}`);
                  }
                }}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  sectionTitle: { color: "#d4d4d4", fontWeight: "600", marginBottom: 8, marginTop: 8 },
  summaryCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 14,
    marginBottom: 12,
  },
  summaryTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 6 },
  summaryText: { color: "#a3a3a3", marginBottom: 2 },
  chartCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 12,
    marginBottom: 12,
  },
  chartRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  chartLabel: { color: "#a3a3a3", width: 60, fontSize: 12 },
  chartTrack: { flex: 1, height: 10, backgroundColor: "#262626", borderRadius: 999 },
  bar: { height: 10, backgroundColor: "#f97316", borderRadius: 999 },
  linePoint: { height: 4, marginTop: 3, backgroundColor: "#fb923c", borderRadius: 999 },
  chartValue: { color: "#d4d4d4", width: 56, textAlign: "right", fontSize: 12 },
  sessionCard: {
    backgroundColor: "#151515",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 12,
    marginBottom: 10,
  },
  sessionTitle: { color: "#fff", fontWeight: "600" },
  sessionMeta: { color: "#737373", marginBottom: 8 },
});
