import { MuscleGroup, type Prisma, prisma } from "@ironlink/db";
import type { GraphQLContext } from "../context.js";
import { clerk, requireAuth } from "../context.js";

type ExerciseWhereInput = Prisma.ExerciseWhereInput;

function getContext(context: unknown): GraphQLContext {
  return context as GraphQLContext;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

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
      const where: ExerciseWhereInput = {
        OR: [{ isCustom: false }, { userId: ctx.user?.id }],
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

      return prisma.exercise.findMany({
        where,
        take: args.limit ?? 50,
        skip: args.offset ?? 0,
        orderBy: { name: "asc" },
      });
    },

    mySplits: async (_parent: unknown, _args: unknown, context: unknown) => {
      const user = requireAuth(getContext(context));

      return prisma.split.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      });
    },
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
  },
};
