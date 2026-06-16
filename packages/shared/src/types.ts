import type {
  MuscleGroup,
  SetType,
  SplitDifficulty,
  SplitStatus,
  SplitVisibility,
} from "./enums.js";

export type PublicUser = {
  id: string;
  username: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  city: string | null;
};

export type ExerciseSummary = {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: string[];
  movementPattern: string | null;
  videoUrl: string | null;
  isCustom: boolean;
};

export type SplitSummary = {
  id: string;
  name: string;
  description: string | null;
  daysPerWeek: number;
  difficulty: SplitDifficulty;
  visibility: SplitVisibility;
  status: SplitStatus;
};

export type RoutineExerciseConfig = {
  exerciseId: string;
  setType: SetType;
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  weightTarget: number | null;
  restSeconds: number | null;
  notes: string | null;
  sortOrder: number;
};
