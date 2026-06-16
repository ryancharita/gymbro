import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { transformSourceExercise } from "../src/seed/exercises.js";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(packageRoot, "prisma/data/exercises.seed.json");

const sourceUrl =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

const response = await fetch(sourceUrl);

if (!response.ok) {
  throw new Error(`Failed to fetch exercises: ${response.status}`);
}

const source = (await response.json()) as Array<{
  name: string;
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  mechanic?: string | null;
  instructions?: string[];
}>;

const exercises = source.map(transformSourceExercise);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(exercises, null, 2));

console.log(`Wrote ${exercises.length} exercises to ${outputPath}`);
