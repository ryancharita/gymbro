import type { Routine, Split, SplitDay, WorkoutSession } from "./graphql";

export type DayStatus = "completed" | "today" | "upcoming" | "rest";

export type WeekDayPlan = {
  id: string;
  label: string;
  title: string;
  muscles: string[];
  status: DayStatus;
  routineId: string | null;
  splitDayId: string | null;
};

export type WorkoutExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
  done?: boolean;
};

export type WorkoutDayPlan = {
  id: string;
  label: string;
  title: string;
  status: DayStatus;
  routineId: string | null;
  exercises: WorkoutExercise[];
};

export type DiscoverBuddy = {
  id: string;
  name: string;
  gym: string;
  distance: string | null;
  rating: number | null;
  tags: string[];
  status: string;
  isFollowing: boolean;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function pickActiveSplit(splits: Split[]): Split | null {
  if (splits.length === 0) return null;
  const published = splits.filter((split) => split.status === "PUBLISHED");
  const pool = published.length > 0 ? published : splits;
  return [...pool].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] ?? null;
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day);
  return copy;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return end;
}

export function sessionsThisWeek(sessions: WorkoutSession[], now = new Date()): WorkoutSession[] {
  const start = startOfWeek(now);
  const end = endOfWeek(now);
  return sessions.filter((session) => {
    if (session.status !== "COMPLETED" || !session.completedAt) return false;
    const completedAt = new Date(session.completedAt);
    return completedAt >= start && completedAt < end;
  });
}

function uniqueMuscles(routine: Routine | undefined): string[] {
  if (!routine) return [];
  const muscles = routine.exercises.flatMap((item) => item.exercise.primaryMuscles);
  return [...new Set(muscles)].slice(0, 4);
}

function routineMap(routines: Routine[]): Map<string, Routine> {
  return new Map(routines.map((routine) => [routine.id, routine]));
}

function dayStatusForRoutine(
  routineId: string | null,
  calendarIndex: number,
  todayIndex: number,
  completedRoutineIds: Set<string>,
  activeRoutineId: string | null,
): DayStatus {
  if (!routineId) return "rest";
  if (activeRoutineId === routineId) return "today";
  if (completedRoutineIds.has(routineId)) return "completed";
  if (calendarIndex === todayIndex) return "today";
  if (calendarIndex < todayIndex) return "upcoming";
  return "upcoming";
}

export function buildWeekPlan(
  split: Split | null,
  routines: Routine[],
  sessions: WorkoutSession[],
  activeSession: WorkoutSession | null,
  now = new Date(),
): WeekDayPlan[] {
  const routinesById = routineMap(routines);
  const todayIndex = (now.getDay() + 6) % 7;
  const completedRoutineIds = new Set(
    sessionsThisWeek(sessions, now)
      .map((session) => session.routineId)
      .filter((id): id is string => !!id),
  );
  const activeRoutineId = activeSession?.routineId ?? null;
  const sortedDays = split ? [...split.days].sort((a, b) => a.dayOrder - b.dayOrder) : [];

  return WEEKDAY_LABELS.map((label, index) => {
    const splitDay: SplitDay | undefined = sortedDays[index];
    const routineId = splitDay?.routineId ?? null;
    const routine = routineId ? routinesById.get(routineId) : undefined;
    const title = routine?.name ?? splitDay?.label ?? "Rest Day";
    const status = dayStatusForRoutine(
      routineId,
      index,
      todayIndex,
      completedRoutineIds,
      activeRoutineId,
    );

    return {
      id: `${label}-${splitDay?.id ?? index}`,
      label,
      title: routineId ? title : "Rest Day",
      muscles: routineId ? uniqueMuscles(routine) : [],
      status,
      routineId,
      splitDayId: splitDay?.id ?? null,
    };
  });
}

export function buildWorkoutDays(
  split: Split | null,
  routines: Routine[],
  sessions: WorkoutSession[],
  activeSession: WorkoutSession | null,
  now = new Date(),
): WorkoutDayPlan[] {
  if (!split) return [];

  const routinesById = routineMap(routines);
  const weekPlan = buildWeekPlan(split, routines, sessions, activeSession, now);
  const completedSetsByExercise = new Map<string, boolean>();

  if (activeSession?.routineId) {
    for (const set of activeSession.sets) {
      if (set.isCompleted) {
        completedSetsByExercise.set(set.exerciseId, true);
      }
    }
  }

  return [...split.days]
    .sort((a, b) => a.dayOrder - b.dayOrder)
    .filter((day) => day.routineId)
    .map((day) => {
      const routine = day.routineId ? routinesById.get(day.routineId) : undefined;
      const weekDay = weekPlan.find((plan) => plan.splitDayId === day.id);
      const status = weekDay?.status ?? "upcoming";
      const exercises: WorkoutExercise[] =
        routine?.exercises
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({
            id: item.id,
            name: item.exercise.name,
            sets: item.sets,
            reps: item.repsMax ?? item.repsMin ?? 0,
            weightKg: item.weightTarget ?? 0,
            done:
              activeSession?.routineId === day.routineId
                ? completedSetsByExercise.get(item.exerciseId) ?? false
                : status === "completed",
          })) ?? [];

      return {
        id: day.id,
        label: day.label,
        title: routine?.name ?? day.label,
        status,
        routineId: day.routineId,
        exercises,
      };
    });
}

export function todayRoutineId(
  split: Split | null,
  routines: Routine[],
  sessions: WorkoutSession[],
  activeSession: WorkoutSession | null,
  now = new Date(),
): string | null {
  if (activeSession?.routineId) return activeSession.routineId;
  const weekPlan = buildWeekPlan(split, routines, sessions, activeSession, now);
  return weekPlan.find((day) => day.status === "today" && day.routineId)?.routineId ?? null;
}

export function weekTrainingProgress(
  split: Split | null,
  sessions: WorkoutSession[],
  now = new Date(),
): { completed: number; total: number } {
  const trainingDays = split?.days.filter((day) => day.routineId).length ?? 0;
  if (trainingDays === 0) return { completed: 0, total: 0 };

  const completedRoutineIds = new Set(
    sessionsThisWeek(sessions, now)
      .map((session) => session.routineId)
      .filter((id): id is string => !!id),
  );

  const splitRoutineIds = split?.days.map((day) => day.routineId).filter((id): id is string => !!id) ?? [];
  const completed = splitRoutineIds.filter((id) => completedRoutineIds.has(id)).length;

  return { completed, total: trainingDays };
}

export function averageWeeklyVolume(sessions: WorkoutSession[]): number {
  const weekly = sessionsThisWeek(sessions);
  if (weekly.length === 0) return 0;
  const total = weekly.reduce((sum, session) => sum + session.totalVolumeKg, 0);
  return Math.round(total / weekly.length);
}
