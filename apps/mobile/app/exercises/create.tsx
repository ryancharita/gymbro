import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { Chip } from "../../src/components/Chip";
import { FormField } from "../../src/components/FormField";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import {
  formatMuscleGroup,
  MUSCLE_GROUP_OPTIONS,
} from "../../src/constants/exercises";
import { createAuthenticatedClient } from "../../src/lib/auth";
import { CREATE_CUSTOM_EXERCISE_MUTATION } from "../../src/lib/graphql";

const EQUIPMENT_PRESETS = [
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "bodyweight",
  "kettlebell",
  "bands",
  "other",
];

export default function CreateExerciseScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [customEquipment, setCustomEquipment] = useState("");
  const [movementPattern, setMovementPattern] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleValue = (
    value: string,
    current: string[],
    setter: (next: string[]) => void,
  ) => {
    setter(
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const saveExercise = async () => {
    setSaving(true);
    setError(null);

    const equipmentValues = [
      ...equipment,
      ...customEquipment
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ];

    try {
      const client = await createAuthenticatedClient(getToken);

      await client.request(CREATE_CUSTOM_EXERCISE_MUTATION, {
        input: {
          name: name.trim(),
          description: description.trim() || undefined,
          primaryMuscles,
          secondaryMuscles,
          equipment: [...new Set(equipmentValues)],
          movementPattern: movementPattern.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
        },
      });

      Alert.alert("Saved", "Custom exercise added to your library.");
      router.replace("/exercises");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save exercise");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout
      title="Custom exercise"
      subtitle="Private to your account. Use this for movements not in the system library."
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <FormField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Cable lateral raise"
        />

        <FormField
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Setup cues or notes"
          multiline
          style={styles.multiline}
        />

        <Text style={styles.sectionLabel}>Primary muscles</Text>
        <View style={styles.chipWrap}>
          {MUSCLE_GROUP_OPTIONS.map((group) => (
            <Chip
              key={`primary-${group}`}
              label={formatMuscleGroup(group)}
              selected={primaryMuscles.includes(group)}
              onPress={() =>
                toggleValue(group, primaryMuscles, setPrimaryMuscles)
              }
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Secondary muscles (optional)</Text>
        <View style={styles.chipWrap}>
          {MUSCLE_GROUP_OPTIONS.map((group) => (
            <Chip
              key={`secondary-${group}`}
              label={formatMuscleGroup(group)}
              selected={secondaryMuscles.includes(group)}
              onPress={() =>
                toggleValue(group, secondaryMuscles, setSecondaryMuscles)
              }
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Equipment</Text>
        <View style={styles.chipWrap}>
          {EQUIPMENT_PRESETS.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={equipment.includes(option)}
              onPress={() => toggleValue(option, equipment, setEquipment)}
            />
          ))}
        </View>

        <FormField
          label="Other equipment (comma-separated)"
          value={customEquipment}
          onChangeText={setCustomEquipment}
          placeholder="e.g. trx, smith machine"
          autoCapitalize="none"
        />

        <FormField
          label="Movement pattern (optional)"
          value={movementPattern}
          onChangeText={setMovementPattern}
          placeholder="e.g. compound, isolation"
          autoCapitalize="none"
        />

        <FormField
          label="Video URL (optional)"
          value={videoUrl}
          onChangeText={setVideoUrl}
          placeholder="https://youtube.com/..."
          autoCapitalize="none"
          keyboardType="url"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label={saving ? "Saving…" : "Save exercise"}
          onPress={() => void saveExercise()}
          disabled={saving}
        />
        <Button
          label="Cancel"
          variant="ghost"
          onPress={() => router.back()}
          disabled={saving}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: "#d4d4d4",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  error: {
    color: "#ef4444",
    marginBottom: 12,
  },
});
