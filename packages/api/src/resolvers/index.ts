import { MuscleGroup, type Prisma, prisma } from "@ironlink/db";
import type { GraphQLContext } from "../context.js";
import { requireAuth } from "../context.js";

type ExerciseWhereInput = Prisma.ExerciseWhereInput;

function getContext(context: unknown): GraphQLContext {
  return context as GraphQLContext;
}

export const resolvers = {
  Query: {
    health: () => "ok",

    me: (_parent: unknown, _args: unknown, context: unknown) => {
      return getContext(context).user;
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
    _placeholder: () => true,
  },
};
