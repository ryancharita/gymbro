import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../src/components/Button";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import {
  DIFFICULTY_LABELS,
  STATUS_LABELS,
  VISIBILITY_LABELS,
} from "../../src/constants/splits";
import { createAuthenticatedClient } from "../../src/lib/auth";
import {
  DUPLICATE_SPLIT_MUTATION,
  MY_SPLITS_QUERY,
  UPDATE_SPLIT_MUTATION,
  type Split,
} from "../../src/lib/graphql";

export default function SplitsScreen() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const loadSplits = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setSplits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      const data = await client.request<{ mySplits: Split[] }>(MY_SPLITS_QUERY);
      setSplits(data.mySplits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load splits");
      setSplits([]);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useFocusEffect(
    useCallback(() => {
      void loadSplits();
    }, [loadSplits]),
  );

  const duplicateSplit = async (id: string) => {
    setDuplicatingId(id);

    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      await client.request(DUPLICATE_SPLIT_MUTATION, { id });
      await loadSplits();
      Alert.alert("Duplicated", "A draft copy of this split was created.");
    } catch (err) {
      Alert.alert(
        "Could not duplicate",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setDuplicatingId(null);
    }
  };

  const publishSplit = async (split: Split) => {
    setPublishingId(split.id);

    try {
      const client = await createAuthenticatedClient(getTokenRef.current);
      await client.request(UPDATE_SPLIT_MUTATION, {
        id: split.id,
        input: {
          name: split.name,
          description: split.description ?? undefined,
          daysPerWeek: split.daysPerWeek,
          difficulty: split.difficulty,
          experienceLevel: split.experienceLevel ?? undefined,
          visibility: split.visibility,
          status: "PUBLISHED",
          days: split.days.map((day) => ({ label: day.label })),
        },
      });
      await loadSplits();
      Alert.alert("Published", "Your split is now published.");
    } catch (err) {
      Alert.alert(
        "Could not publish",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setPublishingId(null);
    }
  };

  const renderSplit = ({ item }: { item: Split }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text
          style={[
            styles.statusBadge,
            item.status === "PUBLISHED" ? styles.publishedBadge : styles.draftBadge,
          ]}
        >
          {STATUS_LABELS[item.status] ?? item.status}
        </Text>
      </View>

      {item.description ? (
        <Text style={styles.cardBody}>{item.description}</Text>
      ) : null}

      <Text style={styles.cardMeta}>
        {item.daysPerWeek} days/week · {DIFFICULTY_LABELS[item.difficulty]}
      </Text>
      <Text style={styles.cardMeta}>
        {VISIBILITY_LABELS[item.visibility]} ·{" "}
        {item.experienceLevel ? `For ${item.experienceLevel}` : "No experience tag"}
      </Text>

      <View style={styles.cardActions}>
        <Button
          label="Edit"
          variant="secondary"
          onPress={() => router.push(`/splits/${item.id}`)}
        />
        {item.status === "DRAFT" ? (
          <Button
            label={publishingId === item.id ? "Publishing..." : "Publish"}
            disabled={publishingId === item.id}
            onPress={() => void publishSplit(item)}
          />
        ) : null}
        <Button
          label={duplicatingId === item.id ? "Duplicating…" : "Duplicate"}
          variant="ghost"
          disabled={duplicatingId === item.id}
          onPress={() => void duplicateSplit(item.id)}
        />
      </View>
    </View>
  );

  return (
    <ScreenLayout
      title="My splits"
      subtitle="Create training splits, save drafts, and publish when ready."
      withBottomNav
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color="#f97316" style={styles.loader} />
      ) : (
        <FlatList
          data={splits}
          keyExtractor={(item) => item.id}
          renderItem={renderSplit}
          style={styles.list}
          contentContainerStyle={splits.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No splits yet. Create your first training split to get started.
            </Text>
          }
        />
      )}

      <Button label="Create split" onPress={() => router.push("/splits/create")} />
      <Button label="Back" variant="ghost" onPress={() => router.back()} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#262626",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  draftBadge: {
    color: "#fbbf24",
    backgroundColor: "rgba(251, 191, 36, 0.12)",
  },
  publishedBadge: {
    color: "#4ade80",
    backgroundColor: "rgba(74, 222, 128, 0.12)",
  },
  cardBody: {
    color: "#a3a3a3",
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  cardMeta: {
    color: "#737373",
    fontSize: 13,
    marginBottom: 4,
  },
  cardActions: {
    marginTop: 12,
  },
  empty: {
    color: "#737373",
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  error: {
    color: "#ef4444",
    marginBottom: 12,
  },
  loader: {
    marginTop: 32,
  },
});
