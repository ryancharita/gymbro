import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { spacing, typography, uiPatterns } from "@ironlink/shared";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../src/components/Button";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { useAppUser } from "../src/hooks/useAppUser";
import { useThemeColors } from "../src/lib/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useAppUser();
  const colors = useThemeColors();

  return (
    <ScreenLayout
      title="Your Split"
      subtitle={user?.gymName ? `${user.gymName} · 6 Day Program` : "Push/Pull/Legs · 6 Day Program"}
      withBottomNav
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.statsRow}>
          <MetricCard icon="trending-up" value="6" label="Week Streak" />
          <MetricCard icon="barbell" value="48" label="Workouts" />
          <MetricCard icon="flash" value="387" label="Avg Cals" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Split Templates</Text>
          <Text style={[styles.linkLabel, { color: colors.accent }]}>Edit Split</Text>
        </View>
        <View style={styles.grid}>
          <ActionCard
            title="Upper/Lower Split"
            description="4 days/week · Beginner friendly"
            trailing="+"
            onPress={() => router.push("/splits")}
          />
          <ActionCard
            title="Bro Split"
            description="5 days/week · Muscle isolation"
            trailing="+"
            onPress={() => router.push("/routines")}
          />
          <ActionCard
            title="Create Custom Split"
            description="Design your own program"
            trailing="+"
            danger
            onPress={() => router.push("/splits/create")}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Active Buddies</Text>
          <Text style={[styles.linkLabel, { color: colors.accent }]}>See All</Text>
        </View>
        <View style={styles.grid}>
          <BuddyRow name="Sarah Chen" status="Working out now · Leg Day" />
          <BuddyRow name="Marcus Johnson" status="At gym · Cardio Session" />
        </View>

        <Button
          label="Start Workout"
          onPress={() => router.push("/workouts")}
        />
        <Button label="Explore Feed" variant="ghost" onPress={() => router.push("/feed")} />
        <Button label="Progress" variant="ghost" onPress={() => router.push("/progress")} />
        {user?.id ? (
          <Button label="Profile" variant="ghost" onPress={() => router.push(`/profile/${user.id}`)} />
        ) : null}
        <Button label="Settings" variant="ghost" onPress={() => router.push("/settings")} />
        <Button label="Sign out" variant="ghost" onPress={async () => {
          await signOut();
          router.replace("/sign-in");
        }} />
      </ScrollView>
    </ScreenLayout>
  );

  function ActionCard({
    title,
    description,
    trailing,
    danger = false,
    onPress,
  }: {
    title: string;
    description: string;
    trailing?: string;
    danger?: boolean;
    onPress: () => void;
  }) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.actionCard,
          {
            backgroundColor: colors.surface,
            borderColor: danger ? colors.accent : colors.border,
          },
          pressed ? { backgroundColor: colors.surfaceElevated } : null,
        ]}
      >
        <View style={styles.actionHeader}>
          <Text style={[styles.actionTitle, { color: danger ? colors.accent : colors.textPrimary }]}>
            {title}
          </Text>
          {trailing ? <Text style={[styles.trailing, { color: colors.accent }]}>{trailing}</Text> : null}
        </View>
        <Text style={[styles.actionBody, { color: colors.textSecondary }]}>{description}</Text>
      </Pressable>
    );
  }

  function MetricCard({
    icon,
    value,
    label,
  }: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    value: string;
    label: string;
  }) {
    return (
      <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.metricIconWrap, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name={icon} size={16} color={colors.accent} />
        </View>
        <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    );
  }

  function BuddyRow({ name, status }: { name: string; status: string }) {
    return (
      <View style={[styles.buddyRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]} />
        <View style={styles.buddyText}>
          <Text style={[styles.buddyName, { color: colors.textPrimary }]}>{name}</Text>
          <Text style={[styles.buddyStatus, { color: colors.textSecondary }]}>{status}</Text>
        </View>
        <Button label="Join" variant="ghost" onPress={() => router.push("/workouts")} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricCard: {
    ...uiPatterns.card,
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    ...typography.heading,
    lineHeight: 24,
  },
  metricLabel: {
    ...typography.caption,
  },
  sectionTitle: {
    ...typography.heading,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  linkLabel: {
    ...typography.label,
  },
  grid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionCard: {
    ...uiPatterns.card,
    minHeight: 104,
    justifyContent: "center",
    gap: spacing.xs,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  actionTitle: {
    ...typography.label,
  },
  trailing: {
    ...typography.heading,
    lineHeight: 20,
  },
  actionBody: {
    ...typography.caption,
  },
  buddyRow: {
    ...uiPatterns.card,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  buddyText: {
    flex: 1,
  },
  buddyName: {
    ...typography.label,
    marginBottom: 2,
  },
  buddyStatus: {
    ...typography.caption,
  },
});
