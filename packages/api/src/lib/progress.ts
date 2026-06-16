import { SessionStatus, prisma } from "@ironlink/db";

type Period = "WEEKLY" | "MONTHLY";

function getPeriodDays(period: Period): number {
  return period === "MONTHLY" ? 30 : 7;
}

function estimateOneRepMax(weight?: number | null, reps?: number | null): number {
  if (!weight || !reps || reps <= 0) return 0;
  return weight * (1 + reps / 30);
}

export async function getProgressOverview(userId: string, period: Period) {
  const since = new Date();
  since.setDate(since.getDate() - getPeriodDays(period));

  const sessions = await prisma.workoutSession.findMany({
    where: { userId, status: SessionStatus.COMPLETED, startedAt: { gte: since } },
    orderBy: { startedAt: "asc" },
    include: { sets: true },
  });

  const volumeByDate = new Map<string, number>();
  const volumeByMuscle = new Map<string, number>();
  let totalPrs = 0;

  for (const session of sessions) {
    const key = session.startedAt.toISOString().slice(0, 10);
    const sessionVolume = session.sets.reduce(
      (sum, set) => sum + (set.weight ?? 0) * (set.reps ?? 0),
      0,
    );
    volumeByDate.set(key, (volumeByDate.get(key) ?? 0) + sessionVolume);
    totalPrs += session.sets.filter((set) => set.isPr).length;

    for (const set of session.sets) {
      const exercise = await prisma.exercise.findUnique({
        where: { id: set.exerciseId },
        select: { primaryMuscles: true },
      });
      const muscle = exercise?.primaryMuscles[0] ?? "FULL_BODY";
      volumeByMuscle.set(
        muscle,
        (volumeByMuscle.get(muscle) ?? 0) + (set.weight ?? 0) * (set.reps ?? 0),
      );
    }
  }

  return {
    sessionVolumeTrend: Array.from(volumeByDate.entries()).map(([date, volumeKg]) => ({
      date,
      value: volumeKg,
    })),
    muscleGroupVolumeTrend: Array.from(volumeByMuscle.entries()).map(
      ([muscleGroup, value]) => ({
        muscleGroup,
        value,
      }),
    ),
    totalSessions: sessions.length,
    totalPrs,
  };
}

export async function getExerciseProgress(
  userId: string,
  exerciseId: string,
  limit: number,
) {
  const sets = await prisma.workoutSet.findMany({
    where: {
      exerciseId,
      isCompleted: true,
      session: { userId, status: SessionStatus.COMPLETED },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: { session: true },
  });

  const points = sets.map((set) => ({
    date: set.createdAt.toISOString().slice(0, 10),
    weight: set.weight,
    reps: set.reps,
    oneRepMaxEstimate: estimateOneRepMax(set.weight, set.reps),
    isPr: set.isPr,
  }));

  return {
    exerciseId,
    points,
  };
}
