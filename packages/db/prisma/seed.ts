import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { SeedExercise } from "../src/seed/exercises.js";

const prisma = new PrismaClient();
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const seedFile = resolve(packageRoot, "prisma/data/exercises.seed.json");

async function main() {
  const exercises = JSON.parse(readFileSync(seedFile, "utf-8")) as SeedExercise[];

  await prisma.exercise.deleteMany({ where: { isCustom: false } });

  const batchSize = 100;
  for (let i = 0; i < exercises.length; i += batchSize) {
    const batch = exercises.slice(i, i + batchSize);

    await prisma.exercise.createMany({
      data: batch.map((exercise) => ({
        name: exercise.name,
        description: exercise.description,
        primaryMuscles: exercise.primaryMuscles,
        secondaryMuscles: exercise.secondaryMuscles,
        equipment: exercise.equipment,
        movementPattern: exercise.movementPattern,
        videoUrl: exercise.videoUrl,
        isCustom: false,
      })),
      skipDuplicates: true,
    });
  }

  const count = await prisma.exercise.count({ where: { isCustom: false } });
  console.log(`Seeded ${count} system exercises`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
