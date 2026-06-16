import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../src/components/Button";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { useAppUser } from "../src/hooks/useAppUser";

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useAppUser();

  return (
    <ScreenLayout
      title={`Hey, ${user?.username ?? "athlete"}`}
      subtitle="Your training hub. Splits, routines, and logging coming soon."
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile ready</Text>
        <Text style={styles.cardBody}>
          {user?.gymName ? `Training at ${user.gymName}` : "No gym set yet"}
        </Text>
        {user?.experienceLevel ? (
          <Text style={styles.cardMeta}>Level: {user.experienceLevel}</Text>
        ) : null}
      </View>

      <Button label="Exercise library" onPress={() => router.push("/exercises")} />
      <Button label="My splits" onPress={() => router.push("/splits")} />
      <Button label="Routines" onPress={() => router.push("/routines")} />
      <Button label="Workout logging" onPress={() => router.push("/workouts")} />
      <Button label="Progress history" onPress={() => router.push("/progress")} />
      <Button label="Home feed" onPress={() => router.push("/feed")} />
      {user?.id ? <Button label="My profile" onPress={() => router.push(`/profile/${user.id}`)} /> : null}
      <Button label="Account settings" onPress={() => router.push("/settings")} />
      <Button
        label="Sign out"
        variant="ghost"
        onPress={async () => {
          await signOut();
          router.replace("/sign-in");
        }}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#262626",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardBody: {
    color: "#a3a3a3",
    fontSize: 15,
    marginBottom: 4,
  },
  cardMeta: {
    color: "#737373",
    fontSize: 14,
  },
});
