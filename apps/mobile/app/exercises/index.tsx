import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "../../src/components/Button";
import { Chip } from "../../src/components/Chip";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import {
  formatEquipment,
  formatMuscleGroup,
  MUSCLE_GROUP_OPTIONS,
} from "../../src/constants/exercises";
import { createAuthenticatedClient } from "../../src/lib/auth";
import {
  EXERCISE_EQUIPMENT_OPTIONS_QUERY,
  EXERCISES_QUERY,
  type Exercise,
} from "../../src/lib/graphql";

const PAGE_SIZE = 50;

export default function ExercisesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadEquipmentOptions = useCallback(async () => {
    try {
      const client = await createAuthenticatedClient(getToken);
      const data = await client.request<{ exerciseEquipmentOptions: string[] }>(
        EXERCISE_EQUIPMENT_OPTIONS_QUERY,
      );
      setEquipmentOptions(data.exerciseEquipmentOptions);
    } catch {
      setEquipmentOptions([]);
    }
  }, [getToken]);

  const loadExercises = useCallback(
    async (nextOffset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const client = await createAuthenticatedClient(getToken);
        const data = await client.request<{
          exercises: { items: Exercise[]; totalCount: number };
        }>(EXERCISES_QUERY, {
          search: debouncedSearch || undefined,
          muscleGroup: muscleGroup ?? undefined,
          equipment: equipment ?? undefined,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });

        setTotalCount(data.exercises.totalCount);
        setOffset(nextOffset + data.exercises.items.length);
        setExercises((current) =>
          append ? [...current, ...data.exercises.items] : data.exercises.items,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load exercises");
        if (!append) {
          setExercises([]);
          setTotalCount(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, equipment, getToken, muscleGroup],
  );

  useEffect(() => {
    void loadEquipmentOptions();
  }, [loadEquipmentOptions]);

  useEffect(() => {
    void loadExercises(0, false);
  }, [loadExercises]);

  const hasMore = exercises.length < totalCount;

  const subtitle = useMemo(() => {
    if (loading) return "Loading exercises…";
    return `${totalCount.toLocaleString()} exercises available`;
  }, [loading, totalCount]);

  const renderExercise = ({ item }: { item: Exercise }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.isCustom ? <Text style={styles.badge}>Custom</Text> : null}
      </View>
      <Text style={styles.cardMeta}>
        {item.primaryMuscles.map(formatMuscleGroup).join(", ")}
      </Text>
      <Text style={styles.cardMeta}>
        {item.equipment.map(formatEquipment).join(", ")}
      </Text>
      {item.movementPattern ? (
        <Text style={styles.cardHint}>{item.movementPattern}</Text>
      ) : null}
    </View>
  );

  return (
    <ScreenLayout title="Exercise library" subtitle={subtitle}>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search by name"
        placeholderTextColor="#666"
        style={styles.searchInput}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.filterLabel}>Muscle group</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
      >
        <Chip
          label="All"
          selected={muscleGroup === null}
          onPress={() => setMuscleGroup(null)}
        />
        {MUSCLE_GROUP_OPTIONS.map((group) => (
          <Chip
            key={group}
            label={formatMuscleGroup(group)}
            selected={muscleGroup === group}
            onPress={() =>
              setMuscleGroup((current) => (current === group ? null : group))
            }
          />
        ))}
      </ScrollView>

      {equipmentOptions.length > 0 ? (
        <>
          <Text style={styles.filterLabel}>Equipment</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
          >
            <Chip
              label="All"
              selected={equipment === null}
              onPress={() => setEquipment(null)}
            />
            {equipmentOptions.map((option) => (
              <Chip
                key={option}
                label={formatEquipment(option)}
                selected={equipment === option}
                onPress={() =>
                  setEquipment((current) => (current === option ? null : option))
                }
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color="#f97316" style={styles.loader} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExercise}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No exercises match your filters.</Text>
          }
          onEndReached={() => {
            if (!loadingMore && hasMore) {
              void loadExercises(offset, true);
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color="#f97316" style={styles.footerLoader} />
            ) : null
          }
        />
      )}

      <View style={styles.actions}>
        <Button
          label="Add custom exercise"
          onPress={() => router.push("/exercises/create")}
        />
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  filterLabel: {
    color: "#a3a3a3",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterRow: {
    marginBottom: 12,
    maxHeight: 44,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#262626",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  badge: {
    color: "#f97316",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardMeta: {
    color: "#a3a3a3",
    fontSize: 14,
    marginBottom: 2,
  },
  cardHint: {
    color: "#737373",
    fontSize: 13,
    marginTop: 4,
    textTransform: "capitalize",
  },
  empty: {
    color: "#737373",
    fontSize: 15,
    textAlign: "center",
    marginTop: 24,
  },
  error: {
    color: "#ef4444",
    marginBottom: 12,
  },
  loader: {
    marginTop: 32,
  },
  footerLoader: {
    marginVertical: 16,
  },
  actions: {
    marginTop: 8,
  },
});
