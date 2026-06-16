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
import { Button } from "../src/components/Button";
import { FormField } from "../src/components/FormField";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { useAppUser } from "../src/hooks/useAppUser";
import { createApiClient } from "../src/lib/api";
import {
  DELETE_ACCOUNT_MUTATION,
  UPDATE_PREFERENCES_MUTATION,
  UPDATE_PROFILE_MUTATION,
} from "../src/lib/graphql";

export default function SettingsScreen() {
  const router = useRouter();
  const { getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const { user, refresh } = useAppUser();

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
      const token = await getToken();
      const client = createApiClient(token);

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
      const token = await getToken();
      const client = createApiClient(token);

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
      const token = await getToken();
      const client = createApiClient(token);
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
    <ScreenLayout title="Account settings" subtitle="Manage your profile and preferences.">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>Profile</Text>
        <FormField label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <FormField label="Bio" value={bio} onChangeText={setBio} multiline style={styles.multiline} />
        <FormField label="Gym" value={gymName} onChangeText={setGymName} />
        <FormField label="City" value={city} onChangeText={setCity} />
        <Button label={saving ? "Saving…" : "Save profile"} onPress={() => void saveProfile()} disabled={saving} />

        <Text style={styles.section}>Clerk account</Text>
        <Text style={styles.meta}>Signed in as {clerkUser?.primaryEmailAddress?.emailAddress}</Text>
        <Button
          label="Manage password & connected accounts"
          variant="ghost"
          onPress={() => void openClerkAccount()}
        />

        <Text style={styles.section}>Notifications</Text>
        <ToggleRow label="New followers" value={notifyOnFollow} onChange={setNotifyOnFollow} />
        <ToggleRow label="Likes on posts" value={notifyOnLike} onChange={setNotifyOnLike} />
        <ToggleRow label="Comments on posts" value={notifyOnComment} onChange={setNotifyOnComment} />
        <ToggleRow label="Weekly summary" value={notifyWeeklySummary} onChange={setNotifyWeeklySummary} />

        <Text style={styles.section}>Privacy</Text>
        <ToggleRow label="Private profile" value={isPrivateProfile} onChange={setIsPrivateProfile} />
        <ToggleRow
          label="Opt out of Buddy Finder"
          value={optOutBuddyFinder}
          onChange={setOptOutBuddyFinder}
        />
        <Button
          label={saving ? "Saving…" : "Save preferences"}
          variant="secondary"
          onPress={() => void savePreferences()}
          disabled={saving}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

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
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#333", true: "#fb923c" }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 12,
  },
  meta: {
    color: "#737373",
    marginBottom: 12,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  toggleLabel: {
    color: "#d4d4d4",
    fontSize: 15,
    flex: 1,
    paddingRight: 12,
  },
  error: {
    color: "#ef4444",
    marginVertical: 12,
  },
});
