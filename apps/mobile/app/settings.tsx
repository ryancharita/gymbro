import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { spacing, typography } from "@ironlink/shared";
import { Button } from "../src/components/Button";
import { FormField } from "../src/components/FormField";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { useAppUser } from "../src/hooks/useAppUser";
import { createAuthenticatedClient } from "../src/lib/auth";
import {
  DELETE_ACCOUNT_MUTATION,
  UPDATE_PREFERENCES_MUTATION,
  UPDATE_PROFILE_MUTATION,
} from "../src/lib/graphql";
import { useTheme } from "../src/lib/theme-preference";

export default function SettingsScreen() {
  const router = useRouter();
  const { getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const { user, refresh } = useAppUser();
  const { preference, setPreference, isDark, colors } = useTheme();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [gymName, setGymName] = useState("");
  const [city, setCity] = useState("");
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [notifyOnFollow, setNotifyOnFollow] = useState(true);
  const [notifyOnLike, setNotifyOnLike] = useState(true);
  const [notifyOnComment, setNotifyOnComment] = useState(true);
  const [notifyWeeklySummary, setNotifyWeeklySummary] = useState(true);
  const [optOutBuddyFinder, setOptOutBuddyFinder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    setUsername(user.username ?? "");
    setBio(user.bio ?? "");
    setGymName(user.gymName ?? "");
    setCity(user.city ?? "");
    setIsPrivateProfile(user.isPrivateProfile);
    setNotifyOnFollow(user.notifyOnFollow);
    setNotifyOnLike(user.notifyOnLike);
    setNotifyOnComment(user.notifyOnComment);
    setNotifyWeeklySummary(user.notifyWeeklySummary);
    setOptOutBuddyFinder(user.optOutBuddyFinder);
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    setError(null);

    try {
      const client = await createAuthenticatedClient(getToken);

      await client.request(UPDATE_PROFILE_MUTATION, {
        input: {
          username: username.trim() || undefined,
          bio: bio.trim() || undefined,
          gymName: gymName.trim() || undefined,
          city: city.trim() || undefined,
        },
      });

      await refresh();
      Alert.alert("Saved", "Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setError(null);

    try {
      const client = await createAuthenticatedClient(getToken);

      await client.request(UPDATE_PREFERENCES_MUTATION, {
        input: {
          isPrivateProfile,
          notifyOnFollow,
          notifyOnLike,
          notifyOnComment,
          notifyWeeklySummary,
          optOutBuddyFinder,
        },
      });

      await refresh();
      Alert.alert("Saved", "Preferences updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save preferences");
    } finally {
      setSaving(false);
    }
  };

  const openClerkAccount = async () => {
    const portalUrl = process.env.EXPO_PUBLIC_CLERK_ACCOUNT_PORTAL_URL;

    if (!portalUrl) {
      Alert.alert(
        "Not configured",
        "Set EXPO_PUBLIC_CLERK_ACCOUNT_PORTAL_URL in your .env to manage password and connected accounts.",
      );
      return;
    }

    await WebBrowser.openBrowserAsync(portalUrl);
  };

  const onSignOut = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  const onDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This will sign you out and schedule your data for deletion. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void deleteAccount(),
        },
      ],
    );
  };

  const deleteAccount = async () => {
    try {
      const client = await createAuthenticatedClient(getToken);
      await client.request(DELETE_ACCOUNT_MUTATION);
      await signOut();
      router.replace("/sign-in");
    } catch (err) {
      Alert.alert(
        "Delete failed",
        err instanceof Error ? err.message : "Could not delete account",
      );
    }
  };

  return (
    <ScreenLayout
      title="Account settings"
      subtitle="Manage your profile and preferences."
      withBottomNav
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.section, { color: colors.textPrimary }]}>Profile</Text>
        <FormField label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <FormField label="Bio" value={bio} onChangeText={setBio} multiline style={styles.multiline} />
        <FormField label="Gym" value={gymName} onChangeText={setGymName} />
        <FormField label="City" value={city} onChangeText={setCity} />
        <Button label={saving ? "Saving…" : "Save profile"} onPress={() => void saveProfile()} disabled={saving} />

        <Text style={[styles.section, { color: colors.textPrimary }]}>Clerk account</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          Signed in as {clerkUser?.primaryEmailAddress?.emailAddress}
        </Text>
        <Button
          label="Manage password & connected accounts"
          variant="ghost"
          onPress={() => void openClerkAccount()}
        />

        <Text style={[styles.section, { color: colors.textPrimary }]}>Appearance</Text>
        <ToggleRow
          label="Dark mode"
          value={isDark}
          onChange={(enabled) => setPreference(enabled ? "dark" : "light")}
          colors={colors}
        />
        {preference === "system" ? (
          <Text style={[styles.meta, { color: colors.textMuted }]}>Following your device theme</Text>
        ) : (
          <Button
            label="Use device theme"
            variant="ghost"
            onPress={() => setPreference("system")}
          />
        )}

        <Text style={[styles.section, { color: colors.textPrimary }]}>Notifications</Text>
        <ToggleRow label="New followers" value={notifyOnFollow} onChange={setNotifyOnFollow} colors={colors} />
        <ToggleRow label="Likes on posts" value={notifyOnLike} onChange={setNotifyOnLike} colors={colors} />
        <ToggleRow label="Comments on posts" value={notifyOnComment} onChange={setNotifyOnComment} colors={colors} />
        <ToggleRow label="Weekly summary" value={notifyWeeklySummary} onChange={setNotifyWeeklySummary} colors={colors} />

        <Text style={[styles.section, { color: colors.textPrimary }]}>Privacy</Text>
        <ToggleRow label="Private profile" value={isPrivateProfile} onChange={setIsPrivateProfile} colors={colors} />
        <ToggleRow
          label="Opt out of Buddy Finder"
          value={optOutBuddyFinder}
          onChange={setOptOutBuddyFinder}
          colors={colors}
        />
        <Button
          label={saving ? "Saving…" : "Save preferences"}
          variant="secondary"
          onPress={() => void savePreferences()}
          disabled={saving}
        />

        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        <Button label="Sign out" variant="ghost" onPress={() => void onSignOut()} />
        <Button label="Delete account" variant="danger" onPress={onDeleteAccount} />
        <Button label="Back to home" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </ScreenLayout>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  colors: {
    border: string;
    textPrimary: string;
    accent: string;
    surfaceElevated: string;
  };
}) {
  return (
    <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceElevated, true: colors.accent }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    ...typography.heading,
    fontSize: 18,
    lineHeight: 24,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  meta: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  toggleLabel: {
    ...typography.body,
    flex: 1,
    paddingRight: spacing.md,
  },
  error: {
    marginVertical: spacing.md,
  },
});
