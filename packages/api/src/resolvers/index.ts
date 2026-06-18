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
import {
  abandonWorkoutSession,
  completeWorkoutSession,
  getOwnedWorkoutSession,
  logWorkoutSet,
  startWorkoutSession,
} from "../lib/workouts.js";
import { getExerciseProgress, getProgressOverview } from "../lib/progress.js";

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

    myWorkoutSessions: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return prisma.workoutSession.findMany({
        where: { userId: user.id },
        orderBy: { startedAt: "desc" },
        take: args.limit ?? 20,
        skip: args.offset ?? 0,
        include: {
          routine: true,
          sets: { include: { exercise: true } },
        },
      });
    },

    workoutSession: async (
      _parent: unknown,
      args: { id: string },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return getOwnedWorkoutSession(user.id, args.id);
    },

    activeWorkoutSession: async (
      _parent: unknown,
      _args: unknown,
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return prisma.workoutSession.findFirst({
        where: { userId: user.id, status: "IN_PROGRESS" },
        include: {
          routine: true,
          sets: {
            orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
            include: { exercise: true },
          },
        },
      });
    },

    progressOverview: async (
      _parent: unknown,
      args: { period?: "WEEKLY" | "MONTHLY" },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return getProgressOverview(user.id, args.period ?? "WEEKLY");
    },

    exerciseProgress: async (
      _parent: unknown,
      args: { exerciseId: string; limit?: number },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return getExerciseProgress(user.id, args.exerciseId, args.limit ?? 30);
    },

    profile: async (
      _parent: unknown,
      args: { userId: string },
      context: unknown,
    ) => {
      const ctx = getContext(context);
      const viewer = requireAuth(ctx);
      const user = await prisma.user.findUnique({ where: { id: args.userId } });
      if (!user) return null;

      const [totalWorkouts, followersCount, followingCount, isFollowing, isRequested, sharedSplits, sharedRoutines, progressPosts] =
        await Promise.all([
          prisma.workoutSession.count({
            where: { userId: user.id, status: "COMPLETED" },
          }),
          prisma.follow.count({ where: { followingId: user.id } }),
          prisma.follow.count({ where: { followerId: user.id } }),
          prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: viewer.id, followingId: user.id } },
          }),
          prisma.follow.findFirst({
            where: { followerId: viewer.id, followingId: user.id, acceptedAt: null },
          }),
          prisma.split.findMany({
            where: { userId: user.id, visibility: "PUBLIC", status: "PUBLISHED" },
            orderBy: { updatedAt: "desc" },
            include: { days: { orderBy: { dayOrder: "asc" } } },
          }),
          prisma.routine.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: "desc" },
            include: { exercises: { orderBy: { sortOrder: "asc" }, include: { exercise: true } } },
          }),
          prisma.post.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            include: { comments: { include: { user: true }, take: 5, orderBy: { createdAt: "asc" } } },
          }),
        ]);

      return {
        user,
        stats: {
          totalWorkouts,
          followersCount,
          followingCount,
          currentStreakDays: 0,
        },
        sharedSplits,
        sharedRoutines,
        progressPosts,
        isFollowing: !!isFollowing?.acceptedAt,
        isRequested: !!isRequested,
      };
    },

    myFollowers: async (_p: unknown, _a: unknown, context: unknown) => {
      const user = requireAuth(getContext(context));
      const follows = await prisma.follow.findMany({
        where: { followingId: user.id, acceptedAt: { not: null } },
        include: { follower: true },
      });
      return follows.map((f) => f.follower);
    },

    myFollowing: async (_p: unknown, _a: unknown, context: unknown) => {
      const user = requireAuth(getContext(context));
      const follows = await prisma.follow.findMany({
        where: { followerId: user.id, acceptedAt: { not: null } },
        include: { following: true },
      });
      return follows.map((f) => f.following);
    },

    discoverUsers: async (
      _p: unknown,
      args: { search?: string; limit?: number; offset?: number },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      const limit = Math.min(args.limit ?? 20, 50);
      const offset = args.offset ?? 0;
      const search = args.search?.trim();

      const following = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true },
      });
      const excludedIds = new Set([user.id, ...following.map((f) => f.followingId)]);

      return prisma.user.findMany({
        where: {
          id: { notIn: [...excludedIds] },
          onboardingComplete: true,
          optOutBuddyFinder: false,
          isPrivateProfile: false,
          ...(search
            ? {
                OR: [
                  { username: { contains: search, mode: "insensitive" } },
                  { gymName: { contains: search, mode: "insensitive" } },
                  { city: { contains: search, mode: "insensitive" } },
                  { bio: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });
    },

    homeFeed: async (
      _p: unknown,
      args: { limit?: number; offset?: number },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      const following = await prisma.follow.findMany({
        where: { followerId: user.id, acceptedAt: { not: null } },
        select: { followingId: true },
      });
      const ids = following.map((f) => f.followingId);
      if (ids.length === 0) return [];
      return prisma.post.findMany({
        where: { userId: { in: ids } },
        orderBy: { createdAt: "desc" },
        take: args.limit ?? 30,
        skip: args.offset ?? 0,
        include: { comments: { include: { user: true }, take: 5, orderBy: { createdAt: "asc" } } },
      });
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

  WorkoutSession: {
    durationSeconds: (parent: { startedAt: Date; completedAt?: Date | null }) => {
      const end = parent.completedAt ?? new Date();
      return Math.max(0, Math.floor((end.getTime() - parent.startedAt.getTime()) / 1000));
    },
    totalVolumeKg: (parent: { sets?: Array<{ weight?: number | null; reps?: number | null }> }) =>
      (parent.sets ?? []).reduce(
        (total, set) => total + (set.weight ?? 0) * (set.reps ?? 0),
        0,
      ),
  },

  Post: {
    user: async (parent: { userId: string }) =>
      prisma.user.findUniqueOrThrow({ where: { id: parent.userId } }),
    likeCount: async (parent: { id: string }) =>
      prisma.postLike.count({ where: { postId: parent.id } }),
    commentCount: async (parent: { id: string }) =>
      prisma.postComment.count({ where: { postId: parent.id } }),
    viewerHasLiked: async (parent: { id: string }, _args: unknown, context: unknown) => {
      const user = requireAuth(getContext(context));
      const like = await prisma.postLike.findUnique({
        where: { postId_userId: { postId: parent.id, userId: user.id } },
      });
      return !!like;
    },
    comments: async (parent: { id: string }) =>
      prisma.postComment.findMany({
        where: { postId: parent.id },
        orderBy: { createdAt: "asc" },
        include: { user: true },
      }),
  },

  PostComment: {
    user: async (parent: { userId: string }) =>
      prisma.user.findUniqueOrThrow({ where: { id: parent.userId } }),
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

    startWorkoutSession: async (
      _parent: unknown,
      args: { routineId: string },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return startWorkoutSession(user.id, args.routineId);
    },

    logWorkoutSet: async (
      _parent: unknown,
      args: {
        input: {
          setId: string;
          weight?: number | null;
          reps?: number | null;
          durationSec?: number | null;
          notes?: string | null;
          isCompleted?: boolean;
        };
      },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return logWorkoutSet(user.id, args.input);
    },

    completeWorkoutSession: async (
      _parent: unknown,
      args: { id: string; notes?: string },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return completeWorkoutSession(user.id, args.id, args.notes);
    },

    abandonWorkoutSession: async (
      _parent: unknown,
      args: { id: string; notes?: string },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      return abandonWorkoutSession(user.id, args.id, args.notes);
    },

    followUser: async (_p: unknown, args: { userId: string }, context: unknown) => {
      const user = requireAuth(getContext(context));
      if (user.id === args.userId) return true;
      const target = await prisma.user.findUnique({ where: { id: args.userId } });
      if (!target) throw new Error("User not found");
      await prisma.follow.upsert({
        where: { followerId_followingId: { followerId: user.id, followingId: args.userId } },
        update: { acceptedAt: target.isPrivateProfile ? null : new Date() },
        create: {
          followerId: user.id,
          followingId: args.userId,
          acceptedAt: target.isPrivateProfile ? null : new Date(),
        },
      });
      return true;
    },

    unfollowUser: async (_p: unknown, args: { userId: string }, context: unknown) => {
      const user = requireAuth(getContext(context));
      await prisma.follow.deleteMany({
        where: { followerId: user.id, followingId: args.userId },
      });
      return true;
    },

    createPost: async (
      _p: unknown,
      args: {
        input: {
          content: string;
          imageUrl?: string;
          splitId?: string;
          routineId?: string;
          workoutSessionId?: string;
        };
      },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      if (!args.input.content.trim()) throw new Error("Post content is required");
      return prisma.post.create({
        data: {
          userId: user.id,
          content: args.input.content.trim(),
          imageUrl: args.input.imageUrl ?? null,
          splitId: args.input.splitId ?? null,
          routineId: args.input.routineId ?? null,
          workoutSessionId: args.input.workoutSessionId ?? null,
        },
        include: { comments: { include: { user: true } } },
      });
    },

    likePost: async (_p: unknown, args: { postId: string }, context: unknown) => {
      const user = requireAuth(getContext(context));
      await prisma.postLike.upsert({
        where: { postId_userId: { postId: args.postId, userId: user.id } },
        update: {},
        create: { postId: args.postId, userId: user.id },
      });
      return true;
    },

    unlikePost: async (_p: unknown, args: { postId: string }, context: unknown) => {
      const user = requireAuth(getContext(context));
      await prisma.postLike.deleteMany({
        where: { postId: args.postId, userId: user.id },
      });
      return true;
    },

    addPostComment: async (
      _p: unknown,
      args: { postId: string; content: string },
      context: unknown,
    ) => {
      const user = requireAuth(getContext(context));
      if (!args.content.trim()) throw new Error("Comment cannot be empty");
      return prisma.postComment.create({
        data: { postId: args.postId, userId: user.id, content: args.content.trim() },
        include: { user: true },
      });
    },
  },
};
