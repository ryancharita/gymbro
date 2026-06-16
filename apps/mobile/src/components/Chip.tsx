import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function Chip({ label, selected = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#1a1a1a",
  },
  chipSelected: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: "#d4d4d4",
    fontSize: 13,
    fontWeight: "500",
  },
  labelSelected: {
    color: "#0f0f0f",
  },
});
