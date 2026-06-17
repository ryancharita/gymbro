import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@ironlink/shared";
import { useThemeColors } from "../lib/theme";

type Props = {
  completed: number;
  total: number;
  label?: string;
};

export function ProgressBar({ completed, total, label }: Props) {
  const colors = useThemeColors();
  const ratio = total > 0 ? Math.min(completed / total, 1) : 0;

  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.header}>
          <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
          <Text style={[styles.count, { color: colors.textSecondary }]}>
            {completed} of {total} completed
          </Text>
        </View>
      ) : null}
      <View style={[styles.track, { backgroundColor: colors.surfaceElevated }]}>
        <View
          style={[
            styles.fill,
            { backgroundColor: colors.accent, width: `${ratio * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  count: {
    ...typography.caption,
  },
  track: {
    height: 8,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radii.pill,
  },
});
