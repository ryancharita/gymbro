import { Pressable, StyleSheet, Text } from "react-native";
import { radii, spacing, typography } from "@ironlink/shared";
import { useThemeColors } from "../lib/theme";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
}: Props) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? { backgroundColor: colors.accent } : null,
        variant === "secondary" ? { backgroundColor: colors.surfaceElevated } : null,
        variant === "ghost" ? { backgroundColor: "transparent", borderColor: colors.border } : null,
        variant === "danger" ? { backgroundColor: colors.danger } : null,
        pressed && !disabled
          ? variant === "primary"
            ? { backgroundColor: colors.accentPressed }
            : variant === "danger"
              ? { backgroundColor: colors.dangerPressed }
              : styles.pressed
          : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === "primary" ? { color: colors.accentText } : null,
          variant === "secondary" ? { color: colors.textPrimary } : null,
          variant === "ghost" ? { color: colors.textSecondary } : null,
          variant === "danger" ? { color: "#FFFFFF" } : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.label,
  },
});
