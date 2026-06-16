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

export type SplitDay = {
  id: string;
  label: string;
  dayOrder: number;
  routineId: string | null;
  routine?: { id: string; name: string } | null;
};

export type Split = {
  id: string;
  name: string;
  description: string | null;
  daysPerWeek: number;
  difficulty: string;
  experienceLevel: string | null;
  visibility: string;
  status: string;
  days: SplitDay[];
  createdAt: string;
  updatedAt: string;
};

export type RoutineExercise = {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  setType: "STRAIGHT" | "SUPERSET" | "DROP_SET" | "AMRAP" | "TIME_BASED";
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  weightTarget: number | null;
  restSeconds: number | null;
  notes: string | null;
  sortOrder: number;
};

export type Routine = {
  id: string;
  name: string;
  notes: string | null;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
};

export type WorkoutSet = {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  setNumber: number;
  setType: "STRAIGHT" | "SUPERSET" | "DROP_SET" | "AMRAP" | "TIME_BASED";
  weight: number | null;
  reps: number | null;
  durationSec: number | null;
  notes: string | null;
  isCompleted: boolean;
  createdAt: string;
};

export type WorkoutSession = {
  id: string;
  routineId: string | null;
  routine: Routine | null;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
  durationSeconds: number;
  totalVolumeKg: number;
  sets: WorkoutSet[];
};

const SPLIT_FIELDS = `
  id
  name
  description
  daysPerWeek
  difficulty
  experienceLevel
  visibility
  status
  createdAt
  updatedAt
  days {
    id
    label
    dayOrder
    routineId
    routine {
      id
      name
    }
  }
`;

const ROUTINE_FIELDS = `
  id
  name
  notes
  createdAt
  updatedAt
  exercises {
    id
    exerciseId
    setType
    sets
    repsMin
    repsMax
    weightTarget
    restSeconds
    notes
    sortOrder
    exercise {
      id
      name
      primaryMuscles
      equipment
    }
  }
`;

const WORKOUT_SESSION_FIELDS = `
  id
  routineId
  status
  startedAt
  completedAt
  notes
  durationSeconds
  totalVolumeKg
  routine {
    id
    name
  }
  sets {
    id
    exerciseId
    setNumber
    setType
    weight
    reps
    durationSec
    notes
    isCompleted
    createdAt
    exercise {
      id
      name
      primaryMuscles
    }
  }
`;

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

export const MY_SPLITS_QUERY = `
  query MySplits {
    mySplits {
      ${SPLIT_FIELDS}
    }
  }
`;

export const SPLIT_QUERY = `
  query Split($id: ID!) {
    split(id: $id) {
      ${SPLIT_FIELDS}
    }
  }
`;

export const CREATE_SPLIT_MUTATION = `
  mutation CreateSplit($input: CreateSplitInput!) {
    createSplit(input: $input) {
      ${SPLIT_FIELDS}
    }
  }
`;

export const UPDATE_SPLIT_MUTATION = `
  mutation UpdateSplit($id: ID!, $input: UpdateSplitInput!) {
    updateSplit(id: $id, input: $input) {
      ${SPLIT_FIELDS}
    }
  }
`;

export const DELETE_SPLIT_MUTATION = `
  mutation DeleteSplit($id: ID!) {
    deleteSplit(id: $id)
  }
`;

export const DUPLICATE_SPLIT_MUTATION = `
  mutation DuplicateSplit($id: ID!) {
    duplicateSplit(id: $id) {
      ${SPLIT_FIELDS}
    }
  }
`;

export const MY_ROUTINES_QUERY = `
  query MyRoutines {
    myRoutines {
      ${ROUTINE_FIELDS}
    }
  }
`;

export const ROUTINE_QUERY = `
  query Routine($id: ID!) {
    routine(id: $id) {
      ${ROUTINE_FIELDS}
    }
  }
`;

export const CREATE_ROUTINE_MUTATION = `
  mutation CreateRoutine($input: CreateRoutineInput!) {
    createRoutine(input: $input) {
      ${ROUTINE_FIELDS}
    }
  }
`;

export const UPDATE_ROUTINE_MUTATION = `
  mutation UpdateRoutine($id: ID!, $input: UpdateRoutineInput!) {
    updateRoutine(id: $id, input: $input) {
      ${ROUTINE_FIELDS}
    }
  }
`;

export const DELETE_ROUTINE_MUTATION = `
  mutation DeleteRoutine($id: ID!) {
    deleteRoutine(id: $id)
  }
`;

export const ASSIGN_ROUTINE_TO_SPLIT_DAY_MUTATION = `
  mutation AssignRoutineToSplitDay($splitDayId: ID!, $routineId: ID) {
    assignRoutineToSplitDay(splitDayId: $splitDayId, routineId: $routineId) {
      id
      routineId
    }
  }
`;

export const MY_WORKOUT_SESSIONS_QUERY = `
  query MyWorkoutSessions($limit: Int, $offset: Int) {
    myWorkoutSessions(limit: $limit, offset: $offset) {
      ${WORKOUT_SESSION_FIELDS}
    }
  }
`;

export const WORKOUT_SESSION_QUERY = `
  query WorkoutSession($id: ID!) {
    workoutSession(id: $id) {
      ${WORKOUT_SESSION_FIELDS}
    }
  }
`;

export const ACTIVE_WORKOUT_SESSION_QUERY = `
  query ActiveWorkoutSession {
    activeWorkoutSession {
      ${WORKOUT_SESSION_FIELDS}
    }
  }
`;

export const START_WORKOUT_SESSION_MUTATION = `
  mutation StartWorkoutSession($routineId: ID!) {
    startWorkoutSession(routineId: $routineId) {
      ${WORKOUT_SESSION_FIELDS}
    }
  }
`;

export const LOG_WORKOUT_SET_MUTATION = `
  mutation LogWorkoutSet($input: LogWorkoutSetInput!) {
    logWorkoutSet(input: $input) {
      id
      weight
      reps
      durationSec
      notes
      isCompleted
    }
  }
`;

export const COMPLETE_WORKOUT_SESSION_MUTATION = `
  mutation CompleteWorkoutSession($id: ID!, $notes: String) {
    completeWorkoutSession(id: $id, notes: $notes) {
      id
      status
      completedAt
      totalVolumeKg
      durationSeconds
    }
  }
`;

export const ABANDON_WORKOUT_SESSION_MUTATION = `
  mutation AbandonWorkoutSession($id: ID!, $notes: String) {
    abandonWorkoutSession(id: $id, notes: $notes) {
      id
      status
      completedAt
    }
  }
`;
