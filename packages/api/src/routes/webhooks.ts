import { prisma } from "@ironlink/db";
import type { FastifyInstance } from "fastify";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/backend";
import { clerk } from "../context.js";

type ClerkUserCreatedEvent = {
  type: "user.created";
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
  };
};

type ClerkUserDeletedEvent = {
  type: "user.deleted";
  data: {
    id: string;
  };
};

export async function registerClerkWebhook(fastify: FastifyInstance) {
  fastify.post("/webhooks/clerk", async (request, reply) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return reply.status(500).send({ error: "Webhook secret not configured" });
    }

    const svixId = request.headers["svix-id"] as string | undefined;
    const svixTimestamp = request.headers["svix-timestamp"] as string | undefined;
    const svixSignature = request.headers["svix-signature"] as string | undefined;

    if (!svixId || !svixTimestamp || !svixSignature) {
      return reply.status(400).send({ error: "Missing Svix headers" });
    }

    const payload = JSON.stringify(request.body);
    const wh = new Webhook(webhookSecret);

    let event: WebhookEvent;

    try {
      event = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as WebhookEvent;
    } catch {
      return reply.status(400).send({ error: "Invalid webhook signature" });
    }

    switch (event.type) {
      case "user.created": {
        const data = (event as ClerkUserCreatedEvent).data;
        const email = data.email_addresses[0]?.email_address ?? null;

        await prisma.user.upsert({
          where: { clerkId: data.id },
          create: {
            clerkId: data.id,
            email,
          },
          update: { email },
        });
        break;
      }

      case "user.deleted": {
        const data = (event as ClerkUserDeletedEvent).data;

        await prisma.user.updateMany({
          where: { clerkId: data.id },
          data: { deletedAt: new Date() },
        });
        break;
      }

      default:
        break;
    }

    return reply.status(200).send({ received: true });
  });
}

export async function registerHealthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async () => {
    let dbOk = false;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    return {
      status: dbOk ? "ok" : "degraded",
      services: {
        database: dbOk ? "ok" : "unavailable",
      },
    };
  });
}

export { clerk };
