import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAppUser } from "../src/hooks/useAppUser";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, loading } = useAppUser();

  if (!isLoaded || (isSignedIn && loading)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#f97316" size="large" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  if (!user?.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f0f0f",
  },
});
