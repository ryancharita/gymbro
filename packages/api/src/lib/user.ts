import { prisma, type User } from "@ironlink/db";
import { clerk } from "./clerk.js";

export async function ensureUser(clerkUserId: string): Promise<User> {
  const existing = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  if (existing) {
    return existing;
  }

  const clerkUser = await clerk.users.getUser(clerkUserId);

  return prisma.user.create({
    data: {
      clerkId: clerkUserId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
      profilePhotoUrl: clerkUser.imageUrl ?? null,
    },
  });
}
