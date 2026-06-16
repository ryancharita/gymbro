import {
  type Prisma,
  type SplitDifficulty,
  type SplitStatus,
  type SplitVisibility,
  prisma,
} from "@ironlink/db";

const SPLIT_INCLUDE = {
  days: {
    orderBy: { dayOrder: "asc" as const },
  },
} satisfies Prisma.SplitInclude;

const SPLIT_WITH_ROUTINES_INCLUDE = {
  days: {
    orderBy: { dayOrder: "asc" as const },
    include: {
      routine: {
        include: {
          exercises: {
            orderBy: { sortOrder: "asc" as const },
          },
        },
      },
    },
  },
} satisfies Prisma.SplitInclude;

export async function getOwnedSplit(userId: string, splitId: string) {
  return prisma.split.findFirst({
    where: { id: splitId, userId },
    include: SPLIT_INCLUDE,
  });
}

export function validateDaysPerWeek(daysPerWeek: number) {
  if (!Number.isInteger(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7) {
    throw new Error("Days per week must be between 1 and 7");
  }
}

export function validateDayLabels(daysPerWeek: number, days: { label: string }[]) {
  if (days.length !== daysPerWeek) {
    throw new Error("Number of day labels must match days per week");
  }

  for (const day of days) {
    if (!day.label.trim()) {
      throw new Error("Each training day needs a label");
    }
  }
}

export function defaultDayLabels(daysPerWeek: number) {
  return Array.from({ length: daysPerWeek }, (_, index) => ({
    label: `Day ${index + 1}`,
  }));
}

type CreateSplitData = {
  name: string;
  description?: string | null;
  daysPerWeek: number;
  difficulty: SplitDifficulty;
  experienceLevel?: string | null;
  visibility?: SplitVisibility;
  status?: SplitStatus;
  days: { label: string }[];
};

export async function createSplit(userId: string, input: CreateSplitData) {
  validateDaysPerWeek(input.daysPerWeek);
  validateDayLabels(input.daysPerWeek, input.days);

  return prisma.split.create({
    data: {
      userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      daysPerWeek: input.daysPerWeek,
      difficulty: input.difficulty,
      experienceLevel: input.experienceLevel?.trim() || null,
      visibility: input.visibility ?? "PRIVATE",
      status: input.status ?? "DRAFT",
      days: {
        create: input.days.map((day, index) => ({
          label: day.label.trim(),
          dayOrder: index + 1,
        })),
      },
    },
    include: SPLIT_INCLUDE,
  });
}

type UpdateSplitData = Partial<CreateSplitData>;

export async function updateSplit(
  userId: string,
  splitId: string,
  input: UpdateSplitData,
) {
  const existing = await getOwnedSplit(userId, splitId);
  if (!existing) {
    throw new Error("Split not found");
  }

  const daysPerWeek = input.daysPerWeek ?? existing.daysPerWeek;
  if (input.daysPerWeek !== undefined) {
    validateDaysPerWeek(daysPerWeek);
  }

  if (input.days) {
    validateDayLabels(daysPerWeek, input.days);
  }

  return prisma.$transaction(async (tx) => {
    if (input.days) {
      await tx.splitDay.deleteMany({ where: { splitId } });
    }

    return tx.split.update({
      where: { id: splitId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() || null }
          : {}),
        ...(input.daysPerWeek !== undefined
          ? { daysPerWeek: input.daysPerWeek }
          : {}),
        ...(input.difficulty !== undefined
          ? { difficulty: input.difficulty }
          : {}),
        ...(input.experienceLevel !== undefined
          ? { experienceLevel: input.experienceLevel?.trim() || null }
          : {}),
        ...(input.visibility !== undefined
          ? { visibility: input.visibility }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.days
          ? {
              days: {
                create: input.days.map((day, index) => ({
                  label: day.label.trim(),
                  dayOrder: index + 1,
                })),
              },
            }
          : {}),
      },
      include: SPLIT_INCLUDE,
    });
  });
}

export async function deleteSplit(userId: string, splitId: string) {
  const existing = await getOwnedSplit(userId, splitId);
  if (!existing) {
    throw new Error("Split not found");
  }

  await prisma.split.delete({ where: { id: splitId } });
  return true;
}

export async function duplicateSplit(userId: string, splitId: string) {
  const source = await prisma.split.findFirst({
    where: { id: splitId, userId },
    include: SPLIT_WITH_ROUTINES_INCLUDE,
  });

  if (!source) {
    throw new Error("Split not found");
  }

  return prisma.$transaction(async (tx) => {
    const duplicate = await tx.split.create({
      data: {
        userId,
        name: `Copy of ${source.name}`,
        description: source.description,
        daysPerWeek: source.daysPerWeek,
        difficulty: source.difficulty,
        experienceLevel: source.experienceLevel,
        visibility: "PRIVATE",
        status: "DRAFT",
      },
    });

    for (const day of source.days) {
      let routineId: string | null = null;

      if (day.routine) {
        const routine = await tx.routine.create({
          data: {
            userId,
            name: day.routine.name,
            notes: day.routine.notes,
            exercises: {
              create: day.routine.exercises.map((exercise) => ({
                exerciseId: exercise.exerciseId,
                setType: exercise.setType,
                sets: exercise.sets,
                repsMin: exercise.repsMin,
                repsMax: exercise.repsMax,
                weightTarget: exercise.weightTarget,
                restSeconds: exercise.restSeconds,
                notes: exercise.notes,
                sortOrder: exercise.sortOrder,
              })),
            },
          },
        });

        routineId = routine.id;
      }

      await tx.splitDay.create({
        data: {
          splitId: duplicate.id,
          label: day.label,
          dayOrder: day.dayOrder,
          routineId,
        },
      });
    }

    return tx.split.findUniqueOrThrow({
      where: { id: duplicate.id },
      include: SPLIT_INCLUDE,
    });
  });
}
