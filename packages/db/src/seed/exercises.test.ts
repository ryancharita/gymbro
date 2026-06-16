import { describe, expect, it } from "vitest";
import { transformSourceExercise } from "./exercises.js";

describe("transformSourceExercise", () => {
  it("maps muscles and normalizes equipment", () => {
    const result = transformSourceExercise({
      name: "Bench Press",
      equipment: "barbell",
      primaryMuscles: ["chest"],
      secondaryMuscles: ["triceps", "shoulders"],
      mechanic: "compound",
      instructions: ["Lie on bench", "Press bar up"],
    });

    expect(result).toMatchObject({
      name: "Bench Press",
      description: "Lie on bench\nPress bar up",
      primaryMuscles: ["CHEST"],
      secondaryMuscles: ["TRICEPS", "SHOULDERS"],
      equipment: ["barbell"],
      movementPattern: "compound",
      videoUrl: null,
    });
  });

  it("handles missing equipment", () => {
    const result = transformSourceExercise({
      name: "Stretch",
      equipment: null,
      primaryMuscles: ["quadriceps"],
      secondaryMuscles: [],
    });

    expect(result.equipment).toEqual(["other"]);
    expect(result.primaryMuscles).toEqual(["QUADS"]);
  });
});
