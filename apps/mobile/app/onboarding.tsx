import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../src/components/Button";
import { FormField } from "../src/components/FormField";
import { ScreenLayout } from "../src/components/ScreenLayout";
import {
  EXPERIENCE_LEVELS,
  GOAL_OPTIONS,
  POPULAR_GYMS,
  TRAINING_STYLE_TAGS,
} from "../src/constants/onboarding";
import { createApiClient } from "../src/lib/api";
import {
  COMPLETE_ONBOARDING_MUTATION,
  USERNAME_AVAILABLE_QUERY,
} from "../src/lib/graphql";

const STEPS = ["Username", "Photo", "Bio", "Gym", "Preferences"] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();

  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [gymName, setGymName] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<string>(EXPERIENCE_LEVELS[0]);
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  const toggleItem = (value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const validateStep = async (): Promise<boolean> => {
    setError(null);

    if (step === 0) {
      if (!username.trim()) {
        setError("Username is required");
        return false;
      }

      const token = await getToken();
      const client = createApiClient(token);
      const data = await client.request<{ isUsernameAvailable: boolean }>(
        USERNAME_AVAILABLE_QUERY,
        { username: username.trim() },
      );

      if (!data.isUsernameAvailable) {
        setError("Username is already taken");
        return false;
      }
    }

    if (step === 4) {
      if (!experienceLevel) {
        setError("Select your experience level");
        return false;
      }
      if (styleTags.length === 0) {
        setError("Select at least one training style");
        return false;
      }
      if (goals.length === 0) {
        setError("Select at least one goal");
        return false;
      }
    }

    return true;
  };

  const onNext = async () => {
    const ok = await validateStep();
    if (!ok) return;

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);

    try {
      const token = await getToken();
      const client = createApiClient(token);

      await client.request(COMPLETE_ONBOARDING_MUTATION, {
        input: {
          username: username.trim(),
          bio: bio.trim() || null,
          profilePhotoUrl: photoUri ?? clerkUser?.imageUrl ?? null,
          gymName: gymName.trim() || null,
          experienceLevel,
          trainingStyleTags: styleTags,
          goals,
        },
      });

      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title={`Step ${step + 1}: ${STEPS[step]}`}
      subtitle="Set up your IronLink profile."
    >
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <FormField
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="iron_lifter"
          />
        )}

        {step === 1 && (
          <View style={styles.photoSection}>
            {photoUri || clerkUser?.imageUrl ? (
              <Image
                source={{ uri: photoUri ?? clerkUser?.imageUrl ?? undefined }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>No photo</Text>
              </View>
            )}
            <Button label="Choose photo" variant="ghost" onPress={() => void pickPhoto()} />
            <Text style={styles.hint}>
              Photo upload to cloud storage coming soon — preview saved locally for now.
            </Text>
          </View>
        )}

        {step === 2 && (
          <FormField
            label="Bio"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            placeholder="Tell the community about your training…"
            style={styles.multiline}
          />
        )}

        {step === 3 && (
          <>
            <FormField
              label="Gym"
              value={gymName}
              onChangeText={setGymName}
              placeholder="Where do you train?"
            />
            <Text style={styles.sectionLabel}>Popular gyms</Text>
            <View style={styles.chips}>
              {POPULAR_GYMS.map((gym) => (
                <Chip
                  key={gym}
                  label={gym}
                  selected={gymName === gym}
                  onPress={() => setGymName(gym)}
                />
              ))}
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.sectionLabel}>Experience level</Text>
            <View style={styles.chips}>
              {EXPERIENCE_LEVELS.map((level) => (
                <Chip
                  key={level}
                  label={level}
                  selected={experienceLevel === level}
                  onPress={() => setExperienceLevel(level)}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Training style</Text>
            <View style={styles.chips}>
              {TRAINING_STYLE_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  selected={styleTags.includes(tag)}
                  onPress={() => toggleItem(tag, styleTags, setStyleTags)}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Goals</Text>
            <View style={styles.chips}>
              {GOAL_OPTIONS.map((goal) => (
                <Chip
                  key={goal}
                  label={goal}
                  selected={goals.includes(goal)}
                  onPress={() => toggleItem(goal, goals, setGoals)}
                />
              ))}
            </View>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.actions}>
        {step > 0 ? (
          <Button label="Back" variant="ghost" onPress={() => setStep((s) => s - 1)} />
        ) : null}
        <Button
          label={step === STEPS.length - 1 ? (loading ? "Finishing…" : "Finish") : "Continue"}
          onPress={() => void onNext()}
          disabled={loading}
        />
      </View>
    </ScreenLayout>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : null]}
    >
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  progressTrack: {
    height: 4,
    backgroundColor: "#262626",
    borderRadius: 999,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#f97316",
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: {
    color: "#737373",
  },
  hint: {
    color: "#737373",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  sectionLabel: {
    color: "#d4d4d4",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 8,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  chipText: {
    color: "#d4d4d4",
    fontSize: 14,
  },
  chipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  error: {
    color: "#ef4444",
    marginVertical: 12,
  },
  actions: {
    paddingTop: 8,
  },
});
