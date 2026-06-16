import { SessionStatus, prisma } from "@ironlink/db";

export async function startWorkoutSession(userId: string, routineId: string) {
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId },
    include: { exercises: { orderBy: { sortOrder: "asc" } } },
  });
  if (!routine) throw new Error("Routine not found");

  const active = await prisma.workoutSession.findFirst({
    where: { userId, status: SessionStatus.IN_PROGRESS },
  });
  if (active) throw new Error("Finish or abandon your current session first");

  const session = await prisma.workoutSession.create({
    data: {
      userId,
      routineId: routine.id,
      status: SessionStatus.IN_PROGRESS,
      sets: {
        create: await Promise.all(
          routine.exercises.flatMap(async (exercise) => {
            const lastSet = await prisma.workoutSet.findFirst({
              where: {
                exerciseId: exercise.exerciseId,
                session: { userId, status: SessionStatus.COMPLETED },
              },
              orderBy: { createdAt: "desc" },
            });

            return Array.from({ length: exercise.sets }, (_, i) => ({
              exerciseId: exercise.exerciseId,
              setNumber: i + 1,
              setType: exercise.setType,
              weight: lastSet?.weight ?? exercise.weightTarget ?? null,
              reps: lastSet?.reps ?? exercise.repsMax ?? exercise.repsMin ?? null,
              durationSec: null,
              isCompleted: false,
              notes: null,
            }));
          }),
        ).then((chunks) => chunks.flat()),
      },
    },
    include: {
      routine: true,
      sets: {
        orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
        include: { exercise: true },
      },
    },
  });

  return session;
}

export async function getOwnedWorkoutSession(userId: string, sessionId: string) {
  return prisma.workoutSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      routine: true,
      sets: {
        orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
        include: { exercise: true },
      },
    },
  });
}

export async function logWorkoutSet(
  userId: string,
  input: {
    setId: string;
    weight?: number | null;
    reps?: number | null;
    durationSec?: number | null;
    notes?: string | null;
    isCompleted?: boolean;
  },
) {
  const set = await prisma.workoutSet.findFirst({
    where: { id: input.setId, session: { userId } },
    include: { session: true },
  });
  if (!set) throw new Error("Workout set not found");
  if (set.session.status !== SessionStatus.IN_PROGRESS) {
    throw new Error("Session is not active");
  }

  return prisma.workoutSet.update({
    where: { id: set.id },
    data: {
      ...(input.weight !== undefined ? { weight: input.weight } : {}),
      ...(input.reps !== undefined ? { reps: input.reps } : {}),
      ...(input.durationSec !== undefined ? { durationSec: input.durationSec } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.isCompleted !== undefined ? { isCompleted: input.isCompleted } : {}),
    },
    include: { exercise: true },
  });
}

export async function completeWorkoutSession(
  userId: string,
  sessionId: string,
  notes?: string,
) {
  const session = await getOwnedWorkoutSession(userId, sessionId);
  if (!session) throw new Error("Workout session not found");
  if (session.status !== SessionStatus.IN_PROGRESS) {
    throw new Error("Session already ended");
  }

  return prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      status: SessionStatus.COMPLETED,
      completedAt: new Date(),
      notes: notes?.trim() || null,
    },
    include: {
      routine: true,
      sets: { include: { exercise: true } },
    },
  });
}

export async function abandonWorkoutSession(
  userId: string,
  sessionId: string,
  notes?: string,
) {
  const session = await getOwnedWorkoutSession(userId, sessionId);
  if (!session) throw new Error("Workout session not found");
  if (session.status !== SessionStatus.IN_PROGRESS) {
    throw new Error("Session already ended");
  }

  return prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      status: SessionStatus.ABANDONED,
      completedAt: new Date(),
      notes: notes?.trim() || null,
    },
    include: {
      routine: true,
      sets: { include: { exercise: true } },
    },
  });
}
