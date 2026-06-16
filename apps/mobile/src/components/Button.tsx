import { Pressable, StyleSheet, Text } from "react-native";

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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={[styles.text, variant === "secondary" ? styles.textDark : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primary: {
    backgroundColor: "#f97316",
  },
  secondary: {
    backgroundColor: "#fff",
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#333",
  },
  danger: {
    backgroundColor: "#dc2626",
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  textDark: {
    color: "#0f0f0f",
  },
});
