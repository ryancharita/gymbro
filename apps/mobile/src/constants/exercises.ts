import { MuscleGroup } from "@ironlink/shared";

export const MUSCLE_GROUP_OPTIONS = Object.values(MuscleGroup);

export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  CHEST: "Chest",
  BACK: "Back",
  SHOULDERS: "Shoulders",
  BICEPS: "Biceps",
  TRICEPS: "Triceps",
  FOREARMS: "Forearms",
  ABS: "Abs",
  QUADS: "Quads",
  HAMSTRINGS: "Hamstrings",
  GLUTES: "Glutes",
  CALVES: "Calves",
  FULL_BODY: "Full body",
  CARDIO: "Cardio",
};

export function formatMuscleGroup(value: string): string {
  return MUSCLE_GROUP_LABELS[value] ?? value;
}

export function formatEquipment(value: string): string {
  return value
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
