export const SplitDifficulty = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
} as const;

export type SplitDifficulty =
  (typeof SplitDifficulty)[keyof typeof SplitDifficulty];

export const SplitVisibility = {
  PUBLIC: "PUBLIC",
  FRIENDS_ONLY: "FRIENDS_ONLY",
  PRIVATE: "PRIVATE",
} as const;

export type SplitVisibility =
  (typeof SplitVisibility)[keyof typeof SplitVisibility];

export const SplitStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
} as const;

export type SplitStatus = (typeof SplitStatus)[keyof typeof SplitStatus];

export const SetType = {
  STRAIGHT: "STRAIGHT",
  SUPERSET: "SUPERSET",
  DROP_SET: "DROP_SET",
  AMRAP: "AMRAP",
  TIME_BASED: "TIME_BASED",
} as const;

export type SetType = (typeof SetType)[keyof typeof SetType];

export const MuscleGroup = {
  CHEST: "CHEST",
  BACK: "BACK",
  SHOULDERS: "SHOULDERS",
  BICEPS: "BICEPS",
  TRICEPS: "TRICEPS",
  FOREARMS: "FOREARMS",
  ABS: "ABS",
  QUADS: "QUADS",
  HAMSTRINGS: "HAMSTRINGS",
  GLUTES: "GLUTES",
  CALVES: "CALVES",
  FULL_BODY: "FULL_BODY",
  CARDIO: "CARDIO",
} as const;

export type MuscleGroup = (typeof MuscleGroup)[keyof typeof MuscleGroup];
