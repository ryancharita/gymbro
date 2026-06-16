import { spacing, typography, uiPatterns } from "@ironlink/shared";
import { StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../lib/theme";

type Props = {
  title: string;
  subtitle: string;
  icon?: string;
};

export function EmptyState({ title, subtitle, icon = "✦" }: Props) {
  const colors = useThemeColors();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.icon, { color: colors.accent }]}>{icon}</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...uiPatterns.card,
    alignItems: "center",
    paddingVertical: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    textAlign: "center",
  },
});
