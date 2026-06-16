import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { spacing, typography, uiPatterns } from "@ironlink/shared";
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
      title={`Hey, ${user?.username ?? "athlete"}`}
      subtitle="Build momentum today. Track sessions, review progress, and share updates."
      withBottomNav
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {user?.gymName ? `Training at ${user.gymName}` : "Set your gym base"}
          </Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            {user?.experienceLevel
              ? `Current level: ${user.experienceLevel}`
              : "Add your level and preferences to personalize recommendations."}
          </Text>
          <Button
            label={user?.id ? "Open profile" : "Complete profile"}
            onPress={() => (user?.id ? router.push(`/profile/${user.id}`) : router.push("/settings"))}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Start training</Text>
        <View style={styles.grid}>
          <ActionCard
            title="Workout logging"
            description="Continue an active session or start from your routine."
            onPress={() => router.push("/workouts")}
          />
          <ActionCard
            title="My splits"
            description="Structure your week and publish your latest split."
            onPress={() => router.push("/splits")}
          />
          <ActionCard
            title="Routines"
            description="Program exercises, sets, and rest for each day."
            onPress={() => router.push("/routines")}
          />
          <ActionCard
            title="Exercise library"
            description="Find or create exercises for your plans."
            onPress={() => router.push("/exercises")}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Insights & social</Text>
        <View style={styles.grid}>
          <ActionCard
            title="Progress history"
            description="Review trends, PRs, and exercise progression."
            onPress={() => router.push("/progress")}
          />
          <ActionCard
            title="Home feed"
            description="See updates from people you follow."
            onPress={() => router.push("/feed")}
          />
          <ActionCard
            title="Account settings"
            description="Manage profile, privacy, and notifications."
            onPress={() => router.push("/settings")}
          />
        </View>

        <Button
          label="Sign out"
          variant="ghost"
          onPress={async () => {
            await signOut();
            router.replace("/sign-in");
          }}
        />
      </ScrollView>
    </ScreenLayout>
  );

  function ActionCard({
    title,
    description,
    onPress,
  }: {
    title: string;
    description: string;
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
            borderColor: colors.border,
          },
          pressed ? { backgroundColor: colors.surfaceElevated } : null,
        ]}
      >
        <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.actionBody, { color: colors.textSecondary }]}>{description}</Text>
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.md,
  },
  card: {
    ...uiPatterns.card,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.heading,
    marginBottom: spacing.sm,
  },
  cardBody: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  cardMeta: {
    ...typography.caption,
  },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
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
  actionTitle: {
    ...typography.label,
  },
  actionBody: {
    ...typography.caption,
  },
});
