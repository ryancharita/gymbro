export type AppUser = {
  id: string;
  username: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  city: string | null;
  gymName: string | null;
  experienceLevel: string | null;
  trainingStyleTags: string[];
  goals: string[];
  onboardingComplete: boolean;
  isPrivateProfile: boolean;
  notifyOnFollow: boolean;
  notifyOnLike: boolean;
  notifyOnComment: boolean;
  notifyWeeklySummary: boolean;
  optOutBuddyFinder: boolean;
  createdAt: string;
};

export const ME_QUERY = `
  query Me {
    me {
      id
      username
      bio
      profilePhotoUrl
      city
      gymName
      experienceLevel
      trainingStyleTags
      goals
      onboardingComplete
      isPrivateProfile
      notifyOnFollow
      notifyOnLike
      notifyOnComment
      notifyWeeklySummary
      optOutBuddyFinder
      createdAt
    }
  }
`;

export const USERNAME_AVAILABLE_QUERY = `
  query IsUsernameAvailable($username: String!) {
    isUsernameAvailable(username: $username)
  }
`;

export const COMPLETE_ONBOARDING_MUTATION = `
  mutation CompleteOnboarding($input: CompleteOnboardingInput!) {
    completeOnboarding(input: $input) {
      id
      username
      onboardingComplete
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      username
      bio
      profilePhotoUrl
      gymName
      city
    }
  }
`;

export const UPDATE_PREFERENCES_MUTATION = `
  mutation UpdatePreferences($input: UpdatePreferencesInput!) {
    updatePreferences(input: $input) {
      id
      isPrivateProfile
      notifyOnFollow
      notifyOnLike
      notifyOnComment
      notifyWeeklySummary
      optOutBuddyFinder
    }
  }
`;

export const DELETE_ACCOUNT_MUTATION = `
  mutation DeleteAccount {
    deleteAccount
  }
`;

export type Exercise = {
  id: string;
  name: string;
  description: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  movementPattern: string | null;
  videoUrl: string | null;
  isCustom: boolean;
};

export const EXERCISES_QUERY = `
  query Exercises(
    $search: String
    $muscleGroup: String
    $equipment: String
    $limit: Int
    $offset: Int
  ) {
    exercises(
      search: $search
      muscleGroup: $muscleGroup
      equipment: $equipment
      limit: $limit
      offset: $offset
    ) {
      totalCount
      items {
        id
        name
        description
        primaryMuscles
        secondaryMuscles
        equipment
        movementPattern
        videoUrl
        isCustom
      }
    }
  }
`;

export const EXERCISE_EQUIPMENT_OPTIONS_QUERY = `
  query ExerciseEquipmentOptions {
    exerciseEquipmentOptions
  }
`;

export const CREATE_CUSTOM_EXERCISE_MUTATION = `
  mutation CreateCustomExercise($input: CreateCustomExerciseInput!) {
    createCustomExercise(input: $input) {
      id
      name
      description
      primaryMuscles
      secondaryMuscles
      equipment
      movementPattern
      videoUrl
      isCustom
    }
  }
`;
