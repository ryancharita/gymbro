import { spacing, typography } from "@ironlink/shared";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../lib/theme";

const NAV_ITEMS = [
  { label: "Home", href: "/home" },
  { label: "Feed", href: "/feed" },
  { label: "Splits", href: "/splits" },
  { label: "Workouts", href: "/workouts" },
  { label: "Progress", href: "/progress" },
] as const;

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useThemeColors();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Pressable
            key={item.href}
            accessibilityRole="button"
            onPress={() => router.push(item.href)}
            style={({ pressed }) => [
              styles.item,
              pressed ? { backgroundColor: colors.surfaceElevated } : null,
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? colors.accent : colors.textMuted },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontWeight: "700",
  },
});
