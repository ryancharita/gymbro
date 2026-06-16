import { useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { Button } from "../../src/components/Button";
import { Chip } from "../../src/components/Chip";
import { FormField } from "../../src/components/FormField";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { SET_TYPE_LABELS, ROUTINE_SET_TYPES } from "../../src/constants/routines";
import { createAuthenticatedClient } from "../../src/lib/auth";
import {
  CREATE_ROUTINE_MUTATION,
  EXERCISES_QUERY,
  ROUTINE_QUERY,
  type Exercise,
  type RoutineExercise,
  UPDATE_ROUTINE_MUTATION,
} from "../../src/lib/graphql";

type BuilderExercise = Omit<RoutineExercise, "id"> & { id: string };

export default function RoutineBuilderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BuilderExercise[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBase = async () => {
      if (!isLoaded || !isSignedIn) return;
      const client = await createAuthenticatedClient(getTokenRef.current);
      const lib = await client.request<{
        exercises: { items: Exercise[] };
      }>(EXERCISES_QUERY, { limit: 200, offset: 0 });
      setExerciseLibrary(lib.exercises.items);
    };
    void loadBase();
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    const loadRoutine = async () => {
      if (isNew || !id) return;
      if (!isLoaded || !isSignedIn) return;

      setLoading(true);
      try {
        const client = await createAuthenticatedClient(getTokenRef.current);
        const data = await client.request<{
          routine: {
            name: string;
            notes: string | null;
            exercises: RoutineExercise[];
          } | null;
        }>(ROUTINE_QUERY, { id });
        if (!data.routine) {
          setError("Routine not found");
          return;
        }
        setName(data.routine.name);
        setNotes(data.routine.notes ?? "");
        setItems(
          data.routine.exercises.map((item) => ({
            ...item,
            id: item.id,
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load routine");
      } finally {
        setLoading(false);
      }
    };
    void loadRoutine();
  }, [id, isLoaded, isNew, isSignedIn]);

  const remainingExercises = useMemo(() => {
    const used = new Set(items.map((item) => item.exerciseId));
    return exerciseLibrary.filter((exercise) => !used.has(exercise.id));
  }, [exerciseLibrary, items]);

  const updateItem = (itemId: string, patch: Partial<BuilderExercise>) => {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    );
  };

  const saveRoutine = async () => {
    if (!name.trim()) {
      setError("Routine name is required");
      return;
    }
    if (items.length === 0) {
      setError("Add at least one exercise");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      const payload = {
        name: name.trim(),
        notes: notes.trim() || undefined,
        exercises: items.map((item) => ({
          exerciseId: item.exerciseId,
          setType: item.setType,
          sets: item.sets,
          repsMin: item.repsMin ?? undefined,
          repsMax: item.repsMax ?? undefined,
          weightTarget: item.weightTarget ?? undefined,
          restSeconds: item.restSeconds ?? undefined,
          notes: item.notes ?? undefined,
        })),
      };

      if (isNew) {
        await client.request(CREATE_ROUTINE_MUTATION, { input: payload });
      } else {
        await client.request(UPDATE_ROUTINE_MUTATION, { id, input: payload });
      }

      router.replace("/routines");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save routine");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenLayout title="Routine builder" subtitle="Loading...">
        <ActivityIndicator color="#f97316" style={{ marginTop: 24 }} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title={isNew ? "New routine" : "Edit routine"}
      subtitle="Add exercises, configure sets/reps, and reorder by drag-and-drop."
    >
      <FormField label="Routine name" value={name} onChangeText={setName} />
      <FormField
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        style={styles.notesInput}
      />

      <Button label="Add exercise" onPress={() => setPickerOpen(true)} />

      <DraggableFlatList
        data={items}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => setItems(data)}
        contentContainerStyle={styles.list}
        renderItem={({ item, drag, isActive }) => (
          <ScaleDecorator>
            <Pressable
              onLongPress={drag}
              delayLongPress={150}
              style={[styles.itemCard, isActive ? styles.itemCardActive : null]}
            >
              <Text style={styles.itemTitle}>{item.exercise.name}</Text>
              <Text style={styles.dragHint}>Long press and drag to reorder</Text>

              <Text style={styles.label}>Set type</Text>
              <View style={styles.rowWrap}>
                {ROUTINE_SET_TYPES.map((type) => (
                  <Chip
                    key={`${item.id}-${type}`}
                    label={SET_TYPE_LABELS[type]}
                    selected={item.setType === type}
                    onPress={() => updateItem(item.id, { setType: type })}
                  />
                ))}
              </View>

              <View style={styles.inline}>
                <FormField
                  label="Sets"
                  value={String(item.sets)}
                  onChangeText={(value) =>
                    updateItem(item.id, { sets: Number.parseInt(value || "0", 10) || 0 })
                  }
                  keyboardType="number-pad"
                  style={styles.inlineInput}
                />
                <FormField
                  label="Reps min"
                  value={item.repsMin?.toString() ?? ""}
                  onChangeText={(value) =>
                    updateItem(item.id, {
                      repsMin: value ? Number.parseInt(value, 10) || null : null,
                    })
                  }
                  keyboardType="number-pad"
                  style={styles.inlineInput}
                />
                <FormField
                  label="Reps max"
                  value={item.repsMax?.toString() ?? ""}
                  onChangeText={(value) =>
                    updateItem(item.id, {
                      repsMax: value ? Number.parseInt(value, 10) || null : null,
                    })
                  }
                  keyboardType="number-pad"
                  style={styles.inlineInput}
                />
              </View>

              <View style={styles.inline}>
                <FormField
                  label="Weight target"
                  value={item.weightTarget?.toString() ?? ""}
                  onChangeText={(value) =>
                    updateItem(item.id, {
                      weightTarget: value ? Number.parseFloat(value) || null : null,
                    })
                  }
                  keyboardType="decimal-pad"
                  style={styles.inlineInput}
                />
                <FormField
                  label="Rest sec"
                  value={item.restSeconds?.toString() ?? ""}
                  onChangeText={(value) =>
                    updateItem(item.id, {
                      restSeconds: value ? Number.parseInt(value, 10) || null : null,
                    })
                  }
                  keyboardType="number-pad"
                  style={styles.inlineInput}
                />
              </View>

              <FormField
                label="Notes"
                value={item.notes ?? ""}
                onChangeText={(value) => updateItem(item.id, { notes: value })}
                style={styles.notesInput}
              />

              <Button
                label="Remove exercise"
                variant="ghost"
                onPress={() =>
                  setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
                }
              />
            </Pressable>
          </ScaleDecorator>
        )}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label={saving ? "Saving..." : "Save routine"} onPress={() => void saveRoutine()} />
      <Button label="Back" variant="ghost" onPress={() => router.back()} />

      <Modal visible={pickerOpen} animationType="slide">
        <ScreenLayout title="Pick exercise" subtitle="Add from your exercise library">
          <ScrollView>
            {remainingExercises.map((exercise) => (
              <View key={exercise.id} style={styles.pickCard}>
                <Text style={styles.itemTitle}>{exercise.name}</Text>
                <Text style={styles.pickMeta}>{exercise.primaryMuscles.join(", ")}</Text>
                <Button
                  label="Add"
                  onPress={() => {
                    setItems((current) => [
                      ...current,
                      {
                        id: `new-${exercise.id}-${Date.now()}`,
                        exerciseId: exercise.id,
                        exercise,
                        setType: "STRAIGHT",
                        sets: 3,
                        repsMin: 8,
                        repsMax: 12,
                        weightTarget: null,
                        restSeconds: 90,
                        notes: null,
                        sortOrder: current.length + 1,
                      },
                    ]);
                    setPickerOpen(false);
                  }}
                />
              </View>
            ))}
          </ScrollView>
          <Button label="Close" variant="ghost" onPress={() => setPickerOpen(false)} />
        </ScreenLayout>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 12 },
  itemCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 14,
    marginBottom: 10,
  },
  itemCardActive: { borderColor: "#f97316", opacity: 0.95 },
  itemTitle: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 6 },
  dragHint: { color: "#737373", fontSize: 12, marginBottom: 8 },
  label: { color: "#d4d4d4", marginBottom: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
  inline: { flexDirection: "row", gap: 8 },
  inlineInput: { flex: 1 },
  notesInput: { minHeight: 48, textAlignVertical: "top" },
  error: { color: "#ef4444", marginBottom: 12 },
  pickCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 14,
    marginBottom: 10,
  },
  pickMeta: { color: "#a3a3a3", marginBottom: 8 },
});
