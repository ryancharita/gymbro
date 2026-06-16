import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function FormField({ label, error, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#666"
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    color: "#d4d4d4",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  error: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 6,
  },
});
