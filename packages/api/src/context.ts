import { verifyToken } from "@clerk/backend";
import type { FastifyRequest } from "fastify";
import type { User } from "@ironlink/db";
import { ensureUser } from "./lib/user.js";

export type GraphQLContext = {
  user: User | null;
  clerkUserId: string | null;
};

export async function buildContext(
  request: FastifyRequest,
): Promise<GraphQLContext> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, clerkUserId: null };
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const clerkUserId = payload.sub;
    const user = await ensureUser(clerkUserId);

    return { user, clerkUserId };
  } catch {
    return { user: null, clerkUserId: null };
  }
}

export function requireAuth(context: GraphQLContext): User {
  if (!context.user) {
    throw new Error("Authentication required");
  }

  return context.user;
}

export { clerk } from "./lib/clerk.js";
