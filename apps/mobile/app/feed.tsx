import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { spacing, typography, uiPatterns } from "@ironlink/shared";
import { Ionicons } from "@expo/vector-icons";
import { Chip } from "../src/components/Chip";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { MOCK_BUDDIES, type DiscoverBuddy } from "../src/lib/mock-week-plan";
import { useThemeColors } from "../src/lib/theme";

const FILTERS = ["All", "Nearby", "Same Gym", "PPL", "Morning", "Evening"] as const;

export default function DiscoverScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("All");

  const buddies = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return MOCK_BUDDIES.filter((buddy) => {
      const matchesQuery =
        !normalized ||
        buddy.name.toLowerCase().includes(normalized) ||
        buddy.gym.toLowerCase().includes(normalized) ||
        buddy.tags.some((tag) => tag.toLowerCase().includes(normalized));

      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Nearby" && buddy.distance.includes("mi")) ||
        (activeFilter === "Same Gym" && buddy.gym.toLowerCase().includes("iron")) ||
        buddy.tags.some((tag) => tag.toLowerCase().includes(activeFilter.toLowerCase()));

      return matchesQuery && matchesFilter;
    });
  }, [query, activeFilter]);

  return (
    <ScreenLayout
      title="Discover"
      subtitle="Find training partners near you."
      withBottomNav
    >
      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, gym, or split..."
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <Chip
            key={filter}
            label={filter}
            selected={activeFilter === filter}
            onPress={() => setActiveFilter(filter)}
          />
        ))}
      </ScrollView>

      <Pressable onPress={() => router.push("/feed/activity")} style={styles.activityLink}>
        <Text style={[styles.activityLinkText, { color: colors.accent }]}>View activity feed →</Text>
      </Pressable>

      <FlatList
        style={styles.list}
        data={buddies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <BuddyCard buddy={item} />}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            No buddies match your search. Try a different filter.
          </Text>
        }
      />
    </ScreenLayout>
  );

  function BuddyCard({ buddy }: { buddy: DiscoverBuddy }) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated, borderColor: colors.accent }]}>
            <Text style={[styles.avatarText, { color: colors.textPrimary }]}>
              {buddy.name
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </Text>
          </View>
          <View style={styles.cardMeta}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{buddy.name}</Text>
            <Text style={[styles.gym, { color: colors.textMuted }]}>
              {buddy.gym} · {buddy.distance}
            </Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.accent} />
              <Text style={[styles.rating, { color: colors.textSecondary }]}>{buddy.rating}</Text>
              <Text style={[styles.status, { color: colors.accent }]}> · {buddy.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tagRow}>
          {buddy.tags.map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            >
              <Text style={[styles.tagText, { color: colors.textMuted }]}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: pressed ? colors.accentPressed : colors.accent },
            ]}
          >
            <Text style={[styles.actionBtnText, { color: colors.accentText }]}>Connect</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtnOutline,
              {
                borderColor: colors.border,
                backgroundColor: pressed ? colors.surfaceElevated : "transparent",
              },
            ]}
          >
            <Text style={[styles.actionBtnOutlineText, { color: colors.textPrimary }]}>Message</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  searchWrap: {
    ...uiPatterns.card,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.sm,
  },
  filterRow: {
    marginBottom: spacing.sm,
    maxHeight: 44,
  },
  activityLink: {
    marginBottom: spacing.md,
  },
  activityLinkText: {
    ...typography.label,
  },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.md, gap: spacing.sm },
  empty: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  card: {
    ...uiPatterns.card,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...typography.label,
    fontWeight: "700",
  },
  cardMeta: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.label,
    fontSize: 16,
  },
  gym: {
    ...typography.caption,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  rating: {
    ...typography.caption,
    fontWeight: "600",
  },
  status: {
    ...typography.caption,
    fontWeight: "600",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tag: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  tagText: {
    ...typography.caption,
    fontSize: 11,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  actionBtnText: {
    ...typography.label,
    fontWeight: "700",
  },
  actionBtnOutline: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  actionBtnOutlineText: {
    ...typography.label,
    fontWeight: "600",
  },
});
