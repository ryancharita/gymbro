import { SetType, type Prisma, prisma } from "@ironlink/db";

const ROUTINE_INCLUDE = {
  exercises: {
    orderBy: { sortOrder: "asc" as const },
    include: { exercise: true },
  },
} satisfies Prisma.RoutineInclude;

type RoutineExerciseInput = {
  exerciseId: string;
  setType: SetType;
  sets: number;
  repsMin?: number | null;
  repsMax?: number | null;
  weightTarget?: number | null;
  restSeconds?: number | null;
  notes?: string | null;
};

function normalizeRoutineExercise(
  item: RoutineExerciseInput,
  index: number,
): Prisma.RoutineExerciseCreateWithoutRoutineInput {
  if (item.sets < 1) {
    throw new Error("Sets must be at least 1");
  }

  if (
    item.repsMin !== undefined &&
    item.repsMax !== undefined &&
    item.repsMin !== null &&
    item.repsMax !== null &&
    item.repsMin > item.repsMax
  ) {
    throw new Error("Reps min cannot be greater than reps max");
  }

  return {
    exercise: { connect: { id: item.exerciseId } },
    setType: item.setType,
    sets: item.sets,
    repsMin: item.repsMin ?? null,
    repsMax: item.repsMax ?? null,
    weightTarget: item.weightTarget ?? null,
    restSeconds: item.restSeconds ?? null,
    notes: item.notes?.trim() || null,
    sortOrder: index + 1,
  };
}

export async function getOwnedRoutine(userId: string, routineId: string) {
  return prisma.routine.findFirst({
    where: { id: routineId, userId },
    include: ROUTINE_INCLUDE,
  });
}

export async function createRoutine(
  userId: string,
  input: { name: string; notes?: string; exercises: RoutineExerciseInput[] },
) {
  if (!input.name.trim()) {
    throw new Error("Routine name is required");
  }
  if (input.exercises.length === 0) {
    throw new Error("Add at least one exercise");
  }

  return prisma.routine.create({
    data: {
      userId,
      name: input.name.trim(),
      notes: input.notes?.trim() || null,
      exercises: {
        create: input.exercises.map((item, index) =>
          normalizeRoutineExercise(item, index),
        ),
      },
    },
    include: ROUTINE_INCLUDE,
  });
}

export async function updateRoutine(
  userId: string,
  routineId: string,
  input: { name?: string; notes?: string; exercises?: RoutineExerciseInput[] },
) {
  const existing = await getOwnedRoutine(userId, routineId);
  if (!existing) throw new Error("Routine not found");

  if (input.name !== undefined && !input.name.trim()) {
    throw new Error("Routine name is required");
  }

  return prisma.$transaction(async (tx) => {
    if (input.exercises) {
      if (input.exercises.length === 0) {
        throw new Error("Add at least one exercise");
      }
      await tx.routineExercise.deleteMany({ where: { routineId } });
    }

    return tx.routine.update({
      where: { id: routineId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
        ...(input.exercises
          ? {
              exercises: {
                create: input.exercises.map((item, index) =>
                  normalizeRoutineExercise(item, index),
                ),
              },
            }
          : {}),
      },
      include: ROUTINE_INCLUDE,
    });
  });
}

export async function deleteRoutine(userId: string, routineId: string) {
  const existing = await getOwnedRoutine(userId, routineId);
  if (!existing) throw new Error("Routine not found");
  await prisma.routine.delete({ where: { id: routineId } });
  return true;
}

export async function assignRoutineToSplitDay(
  userId: string,
  splitDayId: string,
  routineId: string | null,
) {
  const splitDay = await prisma.splitDay.findFirst({
    where: { id: splitDayId, split: { userId } },
  });
  if (!splitDay) throw new Error("Split day not found");

  if (routineId) {
    const routine = await prisma.routine.findFirst({
      where: { id: routineId, userId },
    });
    if (!routine) throw new Error("Routine not found");
  }

  return prisma.splitDay.update({
    where: { id: splitDayId },
    data: { routineId },
  });
}
