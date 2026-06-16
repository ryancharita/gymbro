import { useOAuth, useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { Button } from "../src/components/Button";
import { FormField } from "../src/components/FormField";
import { ScreenLayout } from "../src/components/ScreenLayout";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: "oauth_apple" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignUp = async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError(null);

    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
        return;
      }

      setError("Verification incomplete. Please try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!isLoaded) return;

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      Alert.alert("Code sent", "A new verification code was sent to your email.");
    } catch (err) {
      Alert.alert(
        "Could not resend",
        err instanceof Error ? err.message : "Please try again later.",
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
        setError(err instanceof Error ? err.message : "OAuth sign up failed");
      }
    },
    [router, startAppleOAuth, startGoogleOAuth],
  );

  return (
    <ScreenLayout
      title={pendingVerification ? "Verify your email" : "Create account"}
      subtitle={
        pendingVerification
          ? "Enter the 6-digit code we sent to your email."
          : "Join IronLink and start building your training program."
      }
    >
      {!pendingVerification ? (
        <>
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
            placeholder="At least 8 characters"
          />
        </>
      ) : (
        <FormField
          label="Verification code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          placeholder="123456"
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!pendingVerification ? (
        <>
          <Button label={loading ? "Creating…" : "Sign up"} onPress={onSignUp} disabled={loading} />
          <Button label="Continue with Google" variant="secondary" onPress={() => void onOAuth("google")} />
          <Button label="Continue with Apple" variant="ghost" onPress={() => void onOAuth("apple")} />
        </>
      ) : (
        <>
          <Button label={loading ? "Verifying…" : "Verify email"} onPress={onVerify} disabled={loading} />
          <Button label="Resend code" variant="ghost" onPress={() => void onResend()} />
        </>
      )}

      <Link href="/sign-in" style={styles.link}>
        Already have an account? Sign in
      </Link>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: {
    color: "#ef4444",
    marginBottom: 12,
  },
  link: {
    color: "#f97316",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 8,
  },
});
