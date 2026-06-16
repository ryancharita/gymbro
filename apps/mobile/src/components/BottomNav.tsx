import { spacing, typography } from "@ironlink/shared";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "../lib/theme";

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: "home-outline", iconActive: "home" },
  { label: "Discover", href: "/feed", icon: "search-outline", iconActive: "search" },
  { label: "Workouts", href: "/workouts", icon: "bar-chart-outline", iconActive: "bar-chart" },
  { label: "Profile", href: "/settings", icon: "person-outline", iconActive: "person" },
] as const;

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useThemeColors();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`) ||
          (item.href === "/settings" && pathname.startsWith("/profile/"));
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
            <Ionicons
              name={active ? item.iconActive : item.icon}
              size={18}
              color={active ? colors.accent : colors.textMuted}
            />
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: "600",
  },
});
