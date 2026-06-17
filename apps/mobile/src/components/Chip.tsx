import { Pressable, StyleSheet, Text } from "react-native";
import { radii, spacing, typography } from "@ironlink/shared";
import { useThemeColors } from "../lib/theme";

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function Chip({ label, selected = false, onPress }: Props) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.accent : colors.surface,
        },
        pressed ? styles.pressed : null,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: selected ? colors.accentText : colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    ...typography.caption,
  },
});
