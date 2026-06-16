import { MuscleGroup, type Prisma, prisma } from "@ironlink/db";
import type { GraphQLContext } from "../context.js";
import { clerk, requireAuth } from "../context.js";
import {
  createSplit,
  defaultDayLabels,
  deleteSplit,
  duplicateSplit,
  getOwnedSplit,
  updateSplit,
} from "../lib/splits.js";
import {
  assignRoutineToSplitDay,
  createRoutine,
  deleteRoutine,
  getOwnedRoutine,
  updateRoutine,
} from "../lib/routines.js";

type ExerciseWhereInput = Prisma.ExerciseWhereInput;

function getContext(context: unknown): GraphQLContext {
  return context as GraphQLContext;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

function parseMuscleGroups(values: string[]): MuscleGroup[] {
  const parsed = values
    .map((value) => value.toUpperCase())
    .filter((value): value is MuscleGroup =>
      Object.values(MuscleGroup).includes(value as MuscleGroup),
    );

  return [...new Set(parsed)];
}

function buildExerciseWhere(
  args: {
    search?: string;
    muscleGroup?: string;
    equipment?: string;
  },
  userId?: string,
): ExerciseWhereInput {
  const where: ExerciseWhereInput = {
    OR: [{ isCustom: false }, ...(userId ? [{ userId }] : [])],
  };

  if (args.search) {
    where.name = { contains: args.search, mode: "insensitive" };
  }

  if (
    args.muscleGroup &&
    Object.values(MuscleGroup).includes(args.muscleGroup as MuscleGroup)
  ) {
    where.primaryMuscles = { has: args.muscleGroup as MuscleGroup };
  }

  if (args.equipment) {
    where.equipment = { has: args.equipment };
  }

  return where;
}

function validateUsername(username: string) {
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error(
      "Username must be 3–20 characters and contain only letters, numbers, and underscores",
    );
  }
}

export const resolvers = {
  Query: {
    health: () => "ok",

    me: (_parent: unknown, _args: unknown, context: unknown) => {
      return getContext(context).user;
    },

    isUsernameAvailable: async (
      _parent: unknown,
      args: { username: string },
    ) => {
      validateUsername(args.username);

      const existing = await prisma.user.findUnique({
        where: { username: args.username.toLowerCase() },
      });

      return !existing;
    },

    exercises: async (
      _parent: unknown,
      args: {
        search?: string;
        muscleGroup?: string;
        equipment?: string;
        limit?: number;
        offset?: number;
      },
      context: unknown,
    ) => {
      const ctx = getContext(context);
      const where = buildExerciseWhere(args, ctx.user?.id);

      const [items, totalCount] = await Promise.all([
        prisma.exercise.findMany({
          where,
          take: args.limit ?? 50,
          skip: args.offset ?? 0,
          orderBy: { name: "asc" },
        }),
        prisma.exercise.count({ where }),
      ]);

      return { items, totalCount };
    },

    exerciseEquipmentOptions: async () => {
      const rows = await prisma.$queryRaw<Array<{ equipment: string }>>`
        SELECT DISTINCT unnest(equipment) AS equipment
        FROM exercises
        WHERE is_custom = false
        ORDER BY equipment ASC
      `;

      return rows.map((row) => row.equipment);
    },

    mySplits: async (_parent: unknown, _args: unknown, context: unknown) => {
      const user = requireAuth(getContext(context));

      return prisma.split.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        include: {
          days: {
            orderBy: { dayOrder: "asc" },
          },
        },
      });
    },

    split: async (
      _parent: unknown,
      args: { id: string },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return getOwnedSplit(user.id, args.id);
    },

    myRoutines: async (_parent: unknown, _args: unknown, context: unknown) => {
      const user = requireAuth(getContext(context));
      return prisma.routine.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        include: {
          exercises: {
            orderBy: { sortOrder: "asc" },
            include: { exercise: true },
          },
        },
      });
    },

    routine: async (
      _parent: unknown,
      args: { id: string },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return getOwnedRoutine(user.id, args.id);
    },
  },

  Split: {
    days: async (parent: { id: string; days?: unknown[] }) => {
      if (parent.days) {
        return parent.days;
      }

      return prisma.splitDay.findMany({
        where: { splitId: parent.id },
        orderBy: { dayOrder: "asc" },
      });
    },
  },

  SplitDay: {
    routine: async (parent: { routineId?: string | null }) => {
      if (!parent.routineId) return null;
      return prisma.routine.findUnique({ where: { id: parent.routineId } });
    },
  },

  RoutineExercise: {
    exerciseId: (parent: { exerciseId: string }) => parent.exerciseId,
  },

  Mutation: {
    completeOnboarding: async (
      _parent: unknown,
      args: {
        input: {
          username: string;
          bio?: string;
          profilePhotoUrl?: string;
          gymName?: string;
          experienceLevel: string;
          trainingStyleTags: string[];
          goals: string[];
        };
      },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      const username = args.input.username.toLowerCase();
      validateUsername(username);

      const taken = await prisma.user.findFirst({
        where: { username, NOT: { id: user.id } },
      });

      if (taken) {
        throw new Error("Username is already taken");
      }

      return prisma.user.update({
        where: { id: user.id },
        data: {
          username,
          bio: args.input.bio ?? null,
          profilePhotoUrl: args.input.profilePhotoUrl ?? user.profilePhotoUrl,
          gymName: args.input.gymName ?? null,
          experienceLevel: args.input.experienceLevel,
          trainingStyleTags: args.input.trainingStyleTags,
          goals: args.input.goals,
          onboardingComplete: true,
        },
      });
    },

    updateProfile: async (
      _parent: unknown,
      args: {
        input: {
          username?: string;
          bio?: string;
          profilePhotoUrl?: string;
          gymName?: string;
          city?: string;
        };
      },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      const data: Prisma.UserUpdateInput = {};

      if (args.input.username !== undefined) {
        const username = args.input.username.toLowerCase();
        validateUsername(username);

        const taken = await prisma.user.findFirst({
          where: { username, NOT: { id: user.id } },
        });

        if (taken) {
          throw new Error("Username is already taken");
        }

        data.username = username;
      }

      if (args.input.bio !== undefined) data.bio = args.input.bio;
      if (args.input.profilePhotoUrl !== undefined) {
        data.profilePhotoUrl = args.input.profilePhotoUrl;
      }
      if (args.input.gymName !== undefined) data.gymName = args.input.gymName;
      if (args.input.city !== undefined) data.city = args.input.city;

      return prisma.user.update({
        where: { id: user.id },
        data,
      });
    },

    updatePreferences: async (
      _parent: unknown,
      args: {
        input: {
          isPrivateProfile?: boolean;
          notifyOnFollow?: boolean;
          notifyOnLike?: boolean;
          notifyOnComment?: boolean;
          notifyWeeklySummary?: boolean;
          optOutBuddyFinder?: boolean;
        };
      },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));

      return prisma.user.update({
        where: { id: user.id },
        data: args.input,
      });
    },

    deleteAccount: async (
      _parent: unknown,
      _args: unknown,
      context: unknown,
    ) => {
      const ctx = getContext(context);
      const user = requireAuth(ctx);

      if (!ctx.clerkUserId) {
        throw new Error("Missing Clerk user ID");
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { deletedAt: new Date() },
      });

      await clerk.users.deleteUser(ctx.clerkUserId);

      return true;
    },

    createCustomExercise: async (
      _parent: unknown,
      args: {
        input: {
          name: string;
          description?: string;
          primaryMuscles: string[];
          secondaryMuscles: string[];
          equipment: string[];
          movementPattern?: string;
          videoUrl?: string;
        };
      },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      const name = args.input.name.trim();

      if (!name) {
        throw new Error("Exercise name is required");
      }

      const primaryMuscles = parseMuscleGroups(args.input.primaryMuscles);
      if (primaryMuscles.length === 0) {
        throw new Error("At least one primary muscle group is required");
      }

      const equipment = args.input.equipment
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);

      if (equipment.length === 0) {
        throw new Error("At least one equipment type is required");
      }

      return prisma.exercise.create({
        data: {
          name,
          description: args.input.description?.trim() || null,
          primaryMuscles,
          secondaryMuscles: parseMuscleGroups(args.input.secondaryMuscles),
          equipment,
          movementPattern: args.input.movementPattern?.trim() || null,
          videoUrl: args.input.videoUrl?.trim() || null,
          isCustom: true,
          userId: user.id,
        },
      });
    },

    createSplit: async (
      _parent: unknown,
      args: {
        input: {
          name: string;
          description?: string;
          daysPerWeek: number;
          difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
          experienceLevel?: string;
          visibility?: "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";
          status?: "DRAFT" | "PUBLISHED";
          days?: { label: string }[];
        };
      },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      const name = args.input.name.trim();

      if (!name) {
        throw new Error("Split name is required");
      }

      return createSplit(user.id, {
        name,
        description: args.input.description,
        daysPerWeek: args.input.daysPerWeek,
        difficulty: args.input.difficulty,
        experienceLevel: args.input.experienceLevel,
        visibility: args.input.visibility,
        status: args.input.status,
        days: args.input.days ?? defaultDayLabels(args.input.daysPerWeek),
      });
    },

    updateSplit: async (
      _parent: unknown,
      args: {
        id: string;
        input: {
          name?: string;
          description?: string;
          daysPerWeek?: number;
          difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
          experienceLevel?: string;
          visibility?: "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";
          status?: "DRAFT" | "PUBLISHED";
          days?: { label: string }[];
        };
      },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));

      if (args.input.name !== undefined && !args.input.name.trim()) {
        throw new Error("Split name is required");
      }

      return updateSplit(user.id, args.id, args.input);
    },

    deleteSplit: async (
      _parent: unknown,
      args: { id: string },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return deleteSplit(user.id, args.id);
    },

    duplicateSplit: async (
      _parent: unknown,
      args: { id: string },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return duplicateSplit(user.id, args.id);
    },

    createRoutine: async (
      _parent: unknown,
      args: {
        input: {
          name: string;
          notes?: string;
          exercises: Array<{
            exerciseId: string;
            setType: "STRAIGHT" | "SUPERSET" | "DROP_SET" | "AMRAP" | "TIME_BASED";
            sets: number;
            repsMin?: number;
            repsMax?: number;
            weightTarget?: number;
            restSeconds?: number;
            notes?: string;
          }>;
        };
      },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return createRoutine(user.id, args.input);
    },

    updateRoutine: async (
      _parent: unknown,
      args: {
        id: string;
        input: {
          name?: string;
          notes?: string;
          exercises?: Array<{
            exerciseId: string;
            setType: "STRAIGHT" | "SUPERSET" | "DROP_SET" | "AMRAP" | "TIME_BASED";
            sets: number;
            repsMin?: number;
            repsMax?: number;
            weightTarget?: number;
            restSeconds?: number;
            notes?: string;
          }>;
        };
      },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return updateRoutine(user.id, args.id, args.input);
    },

    deleteRoutine: async (
      _parent: unknown,
      args: { id: string },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return deleteRoutine(user.id, args.id);
    },

    assignRoutineToSplitDay: async (
      _parent: unknown,
      args: { splitDayId: string; routineId?: string | null },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return assignRoutineToSplitDay(user.id, args.splitDayId, args.routineId ?? null);
    },
  },
};
