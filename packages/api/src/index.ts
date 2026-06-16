import "./env.js";
import cors from "@fastify/cors";
import Fastify from "fastify";
import mercurius from "mercurius";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildContext } from "./context.js";
import { resolvers } from "./resolvers/index.js";
import { registerClerkWebhook, registerHealthRoutes } from "./routes/webhooks.js";
import { checkRedisConnection } from "./lib/redis.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(__dirname, "schema.graphql"), "utf-8");

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: true,
  credentials: true,
});

await registerHealthRoutes(fastify);
await registerClerkWebhook(fastify);

await fastify.register(mercurius, {
  schema,
  resolvers,
  graphiql: process.env.NODE_ENV !== "production",
  context: (request) => buildContext(request),
});

const start = async () => {
  try {
    const redisOk = await checkRedisConnection();
    if (!redisOk) {
      fastify.log.warn("Redis unavailable — caching disabled until connected");
    }

    await fastify.listen({ port, host });
    fastify.log.info(`GraphQL API ready at http://${host}:${port}/graphql`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

void start();
