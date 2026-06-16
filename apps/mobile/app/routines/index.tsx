import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { SET_TYPE_LABELS } from "../../src/constants/routines";
import { createAuthenticatedClient } from "../../src/lib/auth";
import {
  ASSIGN_ROUTINE_TO_SPLIT_DAY_MUTATION,
  DELETE_ROUTINE_MUTATION,
  MY_ROUTINES_QUERY,
  type Routine,
} from "../../src/lib/graphql";

export default function RoutinesScreen() {
  const router = useRouter();
  const { splitDayId: splitDayIdParam } = useLocalSearchParams<{
    splitDayId?: string | string[];
  }>();
  const splitDayId = Array.isArray(splitDayIdParam)
    ? splitDayIdParam[0]
    : splitDayIdParam;
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoutines = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setRoutines([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      const data = await client.request<{ myRoutines: Routine[] }>(MY_ROUTINES_QUERY);
      setRoutines(data.myRoutines);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load routines");
      setRoutines([]);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useFocusEffect(
    useCallback(() => {
      void loadRoutines();
    }, [loadRoutines]),
  );

  const assignRoutine = async (routineId: string) => {
    if (!splitDayId) {
      Alert.alert("Missing split day", "Could not determine which split day to assign.");
      return;
    }
    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      await client.request(ASSIGN_ROUTINE_TO_SPLIT_DAY_MUTATION, { splitDayId, routineId });
      Alert.alert("Assigned", "Routine linked to split day.");
      router.back();
    } catch (err) {
      Alert.alert("Could not assign", err instanceof Error ? err.message : "Try again.");
    }
  };

  const deleteRoutine = async (routineId: string) => {
    Alert.alert("Delete routine?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const client = await createAuthenticatedClient(getTokenRef.current);
            await client.request(DELETE_ROUTINE_MUTATION, { id: routineId });
            await loadRoutines();
          } catch (err) {
            Alert.alert(
              "Could not delete",
              err instanceof Error ? err.message : "Please try again.",
            );
          }
        },
      },
    ]);
  };

  return (
    <ScreenLayout
      title="Routines"
      subtitle={
        splitDayId
          ? "Choose a routine to assign to this split day."
          : "Build reusable routines with exercises and set details."
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color="#f97316" style={styles.loader} />
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(item) => item.id}
          style={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No routines yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
              <Text style={styles.meta}>
                {item.exercises.length} exercises ·{" "}
                {item.exercises.length > 0
                  ? SET_TYPE_LABELS[item.exercises[0].setType]
                  : "No set type"}
              </Text>

              {splitDayId ? (
                <Button label="Assign to day" onPress={() => void assignRoutine(item.id)} />
              ) : (
                <>
                  <Button
                    label="Edit builder"
                    variant="secondary"
                    onPress={() => router.push(`/routines/${item.id}`)}
                  />
                  <Button
                    label="Delete"
                    variant="ghost"
                    onPress={() => void deleteRoutine(item.id)}
                  />
                </>
              )}
            </View>
          )}
        />
      )}

      {!splitDayId ? (
        <Button label="Create routine" onPress={() => router.push("/routines/new")} />
      ) : null}
      <Button label="Back" variant="ghost" onPress={() => router.back()} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 16,
    marginBottom: 12,
  },
  name: { color: "#fff", fontSize: 17, fontWeight: "600", marginBottom: 4 },
  notes: { color: "#a3a3a3", marginBottom: 8 },
  meta: { color: "#737373", marginBottom: 12 },
  error: { color: "#ef4444", marginBottom: 12 },
  empty: { color: "#737373", textAlign: "center", marginTop: 20 },
  loader: { marginTop: 32 },
});
