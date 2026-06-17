import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typography } from "@ironlink/shared";
import { useThemeColors } from "../lib/theme";
import { BottomNav } from "./BottomNav";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  withBottomNav?: boolean;
};

export function ScreenLayout({ title, subtitle, children, withBottomNav = false }: Props) {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
        <View style={styles.content}>{children}</View>
      </View>
      {withBottomNav ? <BottomNav /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.display,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
});
