import { useAuth } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../src/components/Button";
import { Chip } from "../../src/components/Chip";
import { FormField } from "../../src/components/FormField";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import {
  DIFFICULTY_LABELS,
  SPLIT_DIFFICULTY_OPTIONS,
  SPLIT_VISIBILITY_OPTIONS,
  STATUS_LABELS,
  VISIBILITY_LABELS,
} from "../../src/constants/splits";
import { createAuthenticatedClient } from "../../src/lib/auth";
import {
  DELETE_SPLIT_MUTATION,
  SPLIT_QUERY,
  UPDATE_SPLIT_MUTATION,
  type Split,
} from "../../src/lib/graphql";

export default function EditSplitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [split, setSplit] = useState<Split | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("4");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [visibility, setVisibility] = useState("PRIVATE");
  const [status, setStatus] = useState("DRAFT");
  const [dayLabels, setDayLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSplit = async () => {
      if (!id) return;
      if (!isLoaded) return;
      if (!isSignedIn) {
        setSplit(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const client = await createAuthenticatedClient(getTokenRef.current);
        const data = await client.request<{ split: Split | null }>(SPLIT_QUERY, {
          id,
        });

        if (!data.split) {
          setError("Split not found");
          return;
        }

        setSplit(data.split);
        setName(data.split.name);
        setDescription(data.split.description ?? "");
        setDaysPerWeek(String(data.split.daysPerWeek));
        setDifficulty(data.split.difficulty);
        setExperienceLevel(data.split.experienceLevel ?? "");
        setVisibility(data.split.visibility);
        setStatus(data.split.status);
        setDayLabels(data.split.days.map((day) => day.label));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load split");
      } finally {
        setLoading(false);
      }
    };

    void loadSplit();
  }, [id, isLoaded, isSignedIn]);

  const saveSplit = async () => {
    if (!id) return;

    setSaving(true);
    setError(null);

    try {
      const client = await createAuthenticatedClient(getTokenRef.current);

      await client.request(UPDATE_SPLIT_MUTATION, {
        id,
        input: {
          name: name.trim(),
          description: description.trim() || undefined,
          daysPerWeek: Number.parseInt(daysPerWeek, 10),
          difficulty,
          experienceLevel: experienceLevel.trim() || undefined,
          visibility,
          status,
          days: dayLabels.map((label) => ({ label: label.trim() })),
        },
      });

      Alert.alert("Saved", "Split updated successfully.");
      router.replace("/splits");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save split");
    } finally {
      setSaving(false);
    }
  };

  const deleteSplit = () => {
    if (!id) return;

    Alert.alert("Delete split?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setSaving(true);

          try {
            const client = await createAuthenticatedClient(getTokenRef.current);
            await client.request(DELETE_SPLIT_MUTATION, { id });
            router.replace("/splits");
          } catch (err) {
            Alert.alert(
              "Could not delete",
              err instanceof Error ? err.message : "Please try again.",
            );
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenLayout title="Edit split" subtitle="Loading…">
        <ActivityIndicator color="#f97316" style={styles.loader} />
      </ScreenLayout>
    );
  }

  if (!split) {
    return (
      <ScreenLayout title="Edit split" subtitle="Split not found.">
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Back to splits" variant="ghost" onPress={() => router.back()} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Edit split"
      subtitle={`Currently ${STATUS_LABELS[status]?.toLowerCase() ?? status}`}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <FormField label="Name" value={name} onChangeText={setName} />
        <FormField
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.multiline}
        />

        <FormField
          label="Days per week"
          value={daysPerWeek}
          onChangeText={setDaysPerWeek}
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

        <Text style={styles.sectionLabel}>Status</Text>
        <View style={styles.chipWrap}>
          <Chip
            label="Draft"
            selected={status === "DRAFT"}
            onPress={() => setStatus("DRAFT")}
          />
          <Chip
            label="Published"
            selected={status === "PUBLISHED"}
            onPress={() => setStatus("PUBLISHED")}
          />
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
          />
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label={saving ? "Saving…" : "Save changes"}
          onPress={() => void saveSplit()}
          disabled={saving}
        />
        <Button
          label="Delete split"
          variant="danger"
          onPress={deleteSplit}
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
  loader: {
    marginTop: 32,
  },
});
