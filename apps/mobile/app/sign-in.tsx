import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "../src/components/Button";
import { FormField } from "../src/components/FormField";
import { ScreenLayout } from "../src/components/ScreenLayout";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: "oauth_apple" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError(null);

    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
        return;
      }

      setError("Additional verification required. Check your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    if (!isLoaded || !email) {
      Alert.alert("Enter your email", "Please enter your email address first.");
      return;
    }

    try {
      await signIn.create({ strategy: "reset_password_email_code", identifier: email });
      Alert.alert(
        "Check your email",
        "We sent a password reset link to your email address.",
      );
    } catch (err) {
      Alert.alert(
        "Reset failed",
        err instanceof Error ? err.message : "Could not send reset email",
      );
    }
  };

  const onOAuth = useCallback(
    async (provider: "google" | "apple") => {
      try {
        const startFlow = provider === "google" ? startGoogleOAuth : startAppleOAuth;
        const { createdSessionId, setActive: setOAuthActive } = await startFlow();

        if (createdSessionId) {
          await setOAuthActive!({ session: createdSessionId });
          router.replace("/");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "OAuth sign in failed");
      }
    },
    [router, startAppleOAuth, startGoogleOAuth],
  );

  return (
    <ScreenLayout
      title="Welcome back"
      subtitle="Sign in to continue tracking your training."
    >
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <FormField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Your password"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label={loading ? "Signing in…" : "Sign in"} onPress={onSignIn} disabled={loading} />
      <Button label="Continue with Google" variant="secondary" onPress={() => void onOAuth("google")} />
      <Button label="Continue with Apple" variant="ghost" onPress={() => void onOAuth("apple")} />

      <View style={styles.links}>
        <Text style={styles.link} onPress={() => void onForgotPassword()}>
          Forgot password?
        </Text>
        <Link href="/sign-up" style={styles.link}>
          Create an account
        </Link>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: {
    color: "#ef4444",
    marginBottom: 12,
  },
  links: {
    marginTop: 8,
    gap: 12,
  },
  link: {
    color: "#f97316",
    fontSize: 15,
    fontWeight: "500",
  },
});
