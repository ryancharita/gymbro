# IronLink

Mobile-first training platform — splits, routines, workout logging, and progress tracking.

## Monorepo structure

```
├── apps/
│   └── mobile/          # React Native / Expo app
├── packages/
│   ├── api/             # GraphQL API (Fastify + Mercurius)
│   ├── db/              # Prisma schema & migrations
│   └── shared/          # Shared types, constants, utilities
├── docker-compose.yml   # Local PostgreSQL (PostGIS) + Redis
└── CONTRIBUTING.md      # Branch, commit, and PR guidelines
```

## Prerequisites

- Node.js 22+
- Docker Desktop (for local PostgreSQL + Redis)
- Clerk account (for auth — see RJC-15)

## Getting started

```bash
# Install dependencies
npm install

# Start local infrastructure
npm run docker:up

# Copy env files and fill in values
cp packages/db/.env.example packages/db/.env
cp packages/api/.env.example packages/api/.env
cp apps/mobile/.env.example apps/mobile/.env

# Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate

# Start all dev servers
npm run dev

# Or individually
npm run dev:api      # GraphQL at http://localhost:3001/graphql
npm run dev:mobile   # Expo dev server
```

## Phase 1 MVP (RJC-5)

| Ticket | Feature |
|--------|---------|
| RJC-28 | Backend infra — PostgreSQL, Redis, GraphQL, Clerk JWT |
| RJC-15 | Auth & onboarding (Clerk) |
| RJC-10 | Exercise library (500+ exercises) |
| RJC-9  | Split CRUD & visibility |
| RJC-11 | Routine builder |
| RJC-12 | Workout logging |
| RJC-13 | Progress history & PR detection |
| RJC-14 | User profiles & home feed |

See [Linear — gym-bro project](https://linear.app/rjcha/project/gym-bro) for full ticket details.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all packages in dev mode |
| `npm run build` | Build all packages |
| `npm run typecheck` | TypeScript check across monorepo |
| `npm run test` | Run unit tests |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run docker:up` | Start PostgreSQL + Redis containers |

## Environment

Secrets are never committed. See `.env.example` files in each package for required variables.

- **Mobile:** `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_URL`
- **API:** `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `DATABASE_URL`, `REDIS_URL`

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a PR. Every branch must reference a Linear ticket (`feat/rjc-XX-...`).
