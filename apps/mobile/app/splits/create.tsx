import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { Chip } from "../../src/components/Chip";
import { FormField } from "../../src/components/FormField";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import {
  DIFFICULTY_LABELS,
  SPLIT_DIFFICULTY_OPTIONS,
  SPLIT_VISIBILITY_OPTIONS,
  VISIBILITY_LABELS,
} from "../../src/constants/splits";
import { createAuthenticatedClient } from "../../src/lib/auth";
import { CREATE_SPLIT_MUTATION } from "../../src/lib/graphql";

export default function CreateSplitScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("4");
  const [difficulty, setDifficulty] = useState<string>("INTERMEDIATE");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [visibility, setVisibility] = useState<string>("PRIVATE");
  const [dayLabels, setDayLabels] = useState<string[]>(
    Array.from({ length: 4 }, (_, index) => `Day ${index + 1}`),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedDaysPerWeek = useMemo(() => {
    const value = Number.parseInt(daysPerWeek, 10);
    return Number.isNaN(value) ? 0 : value;
  }, [daysPerWeek]);

  const syncDayLabels = (count: number) => {
    setDayLabels((current) => {
      if (count < 1 || count > 7) return current;

      if (current.length === count) return current;
      if (current.length < count) {
        return [
          ...current,
          ...Array.from({ length: count - current.length }, (_, index) =>
            `Day ${current.length + index + 1}`,
          ),
        ];
      }

      return current.slice(0, count);
    });
  };

  const saveSplit = async (status: "DRAFT" | "PUBLISHED") => {
    setSaving(true);
    setError(null);

    try {
      const client = await createAuthenticatedClient(getToken);

      await client.request(CREATE_SPLIT_MUTATION, {
        input: {
          name: name.trim(),
          description: description.trim() || undefined,
          daysPerWeek: parsedDaysPerWeek,
          difficulty,
          experienceLevel: experienceLevel.trim() || undefined,
          visibility,
          status,
          days: dayLabels.map((label) => ({ label: label.trim() })),
        },
      });

      Alert.alert(
        status === "DRAFT" ? "Draft saved" : "Split published",
        status === "DRAFT"
          ? "You can keep editing this split before publishing."
          : "Your split is ready to use.",
      );
      router.replace("/splits");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save split");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout
      title="Create split"
      subtitle="Set your weekly structure now. Routines can be assigned in a later step."
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <FormField label="Name" value={name} onChangeText={setName} placeholder="Push / Pull / Legs" />
        <FormField
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Training focus or notes"
          multiline
          style={styles.multiline}
        />

        <FormField
          label="Days per week"
          value={daysPerWeek}
          onChangeText={(value) => {
            setDaysPerWeek(value);
            const count = Number.parseInt(value, 10);
            if (!Number.isNaN(count)) {
              syncDayLabels(count);
            }
          }}
          keyboardType="number-pad"
        />

        <Text style={styles.sectionLabel}>Difficulty</Text>
        <View style={styles.chipWrap}>
          {SPLIT_DIFFICULTY_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={DIFFICULTY_LABELS[option]}
              selected={difficulty === option}
              onPress={() => setDifficulty(option)}
            />
          ))}
        </View>

        <FormField
          label="Experience level (optional)"
          value={experienceLevel}
          onChangeText={setExperienceLevel}
          placeholder="e.g. Intermediate lifter"
        />

        <Text style={styles.sectionLabel}>Visibility</Text>
        <View style={styles.chipWrap}>
          {SPLIT_VISIBILITY_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={VISIBILITY_LABELS[option]}
              selected={visibility === option}
              onPress={() => setVisibility(option)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Training day labels</Text>
        {dayLabels.map((label, index) => (
          <FormField
            key={`day-${index}`}
            label={`Day ${index + 1}`}
            value={label}
            onChangeText={(value) =>
              setDayLabels((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? value : item,
                ),
              )
            }
            placeholder={`Day ${index + 1} — Chest & Triceps`}
          />
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label={saving ? "Saving…" : "Save draft"}
          onPress={() => void saveSplit("DRAFT")}
          disabled={saving}
        />
        <Button
          label={saving ? "Saving…" : "Publish split"}
          variant="secondary"
          onPress={() => void saveSplit("PUBLISHED")}
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
