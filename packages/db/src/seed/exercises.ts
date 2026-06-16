import type { MuscleGroup } from "@ironlink/shared";
import { MuscleGroup as MuscleGroupEnum } from "@ironlink/shared";

type SourceExercise = {
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  mechanic?: string | null;
  instructions?: string[];
};

export type SeedExercise = {
  name: string;
  description: string | null;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: string[];
  movementPattern: string | null;
  videoUrl: string | null;
};

const MUSCLE_MAP: Record<string, MuscleGroup> = {
  abdominals: MuscleGroupEnum.ABS,
  abductors: MuscleGroupEnum.GLUTES,
  adductors: MuscleGroupEnum.HAMSTRINGS,
  biceps: MuscleGroupEnum.BICEPS,
  calves: MuscleGroupEnum.CALVES,
  chest: MuscleGroupEnum.CHEST,
  forearms: MuscleGroupEnum.FOREARMS,
  glutes: MuscleGroupEnum.GLUTES,
  hamstrings: MuscleGroupEnum.HAMSTRINGS,
  lats: MuscleGroupEnum.BACK,
  "lower back": MuscleGroupEnum.BACK,
  "middle back": MuscleGroupEnum.BACK,
  traps: MuscleGroupEnum.BACK,
  triceps: MuscleGroupEnum.TRICEPS,
  quadriceps: MuscleGroupEnum.QUADS,
  shoulders: MuscleGroupEnum.SHOULDERS,
};

function mapMuscles(muscles: string[]): MuscleGroup[] {
  const mapped = muscles
    .map((muscle) => MUSCLE_MAP[muscle.toLowerCase()])
    .filter((muscle): muscle is MuscleGroup => muscle !== undefined);

  return [...new Set(mapped)];
}

function normalizeEquipment(equipment: string | null | undefined): string {
  if (!equipment) return "other";

  const value = equipment.trim().toLowerCase();

  if (value === "body only") return "bodyweight";
  if (value === "null" || value === "") return "other";

  return value;
}

export function transformSourceExercise(source: SourceExercise): SeedExercise {
  const primaryMuscles = mapMuscles(source.primaryMuscles);
  const secondaryMuscles = mapMuscles(source.secondaryMuscles);

  return {
    name: source.name.trim(),
    description: source.instructions?.length
      ? source.instructions.join("\n")
      : null,
    primaryMuscles:
      primaryMuscles.length > 0 ? primaryMuscles : [MuscleGroupEnum.FULL_BODY],
    secondaryMuscles,
    equipment: [normalizeEquipment(source.equipment)],
    movementPattern: source.mechanic ?? null,
    videoUrl: null,
  };
}
