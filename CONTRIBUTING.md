# IronLink — Project Guidelines

> This document is the source of truth for how we work on this codebase. All contributors (engineers, contractors, and AI agents) must follow these guidelines.

---

## Table of Contents

1. [Branch Naming](#1-branch-naming)
2. [Commit Messages](#2-commit-messages)
3. [Pull Requests](#3-pull-requests)
4. [Code Review](#4-code-review)
5. [Merge Strategy](#5-merge-strategy)
6. [Definition of Done](#6-definition-of-done)
7. [Project Structure](#7-project-structure)
8. [Environment & Secrets](#8-environment--secrets)
9. [Testing](#9-testing)
10. [CI/CD](#10-cicd)
11. [Linear Workflow](#11-linear-workflow)

---

## 1. Branch Naming

Every branch **must be tied to a Linear ticket**. Never push directly to `main`.

### Format

```
<type>/rjc-<ticket-number>-<short-description>
```

### Types

| Type | When to use |
| -- | -- |
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `chore` | Tooling, config, dependency updates |
| `refactor` | Code restructure with no behaviour change |
| `docs` | Documentation only |
| `test` | Adding or updating tests |

### Examples

```bash
feat/rjc-9-split-crud-visibility
feat/rjc-12-workout-logging-rest-timer
fix/rjc-13-pr-detection-edge-case
chore/rjc-28-postgres-postgis-setup
docs/rjc-15-clerk-auth-setup
```

### Rules

* Use **lowercase kebab-case** only — no spaces, underscores, or uppercase
* Keep the description **short** (3–5 words max)
* Branch off `main` unless explicitly building on another feature branch (document this in your PR)

---

## 2. Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) standard.

### Format

```
<type>(rjc-<ticket>): <short imperative description>

[optional body]

[optional footer: e.g. BREAKING CHANGE, closes RJC-XX]
```

### Examples

```
feat(rjc-9): add split duplication with deep-copy of routines

fix(rjc-12): prevent rest timer from resetting on app background

chore(rjc-28): provision PostGIS extension on staging DB

refactor(rjc-11): extract set-type logic into reusable hook

docs(rjc-15): add Clerk environment variable setup guide
```

### Rules

* Use the **imperative mood** — "add", "fix", "remove", not "added", "fixes", "removed"
* Keep the subject line **under 72 characters**
* Body is optional but encouraged for non-obvious changes
* Reference the Linear ticket in the scope — this auto-links commits in Linear

---

## 3. Pull Requests

### Creating a PR

When your branch is ready, open a PR **targeting** `main`.

**PR title format:**

```
[RJC-<number>] <Short description of what was done>
```

**Examples:**

```
[RJC-9] Split CRUD with visibility controls
[RJC-12] Workout logging — active session UI with rest timer & offline support
[RJC-15] Clerk authentication integration
```

### PR Description Template

Every PR must include the template in `.github/PULL_REQUEST_TEMPLATE.md`.

### PR Rules

* PRs must be **reviewed and approved by at least 1 other contributor** before merging
* PRs should be **small and focused** — one ticket, one concern
* Draft PRs are encouraged for early feedback
* **Do not merge your own PR** unless you are the sole contributor on the project

---

## 4. Code Review

### Reviewer Responsibilities

* Review within **1 business day** of being assigned
* Check for: correctness, edge cases, security issues, test coverage, and adherence to these guidelines
* Approve only when genuinely confident the code is ready

### Author Responsibilities

* Respond to all review comments before merging
* Don't dismiss review comments without discussion

---

## 5. Merge Strategy

* **Squash and merge** is the default for feature branches
* The squash commit message must follow the PR title format: `[RJC-XX] Description`

### After Merging

1. Delete the feature branch
2. Move the Linear ticket to **Done**
3. Verify on staging before considering it done

---

## 6. Definition of Done

A ticket is **Done** only when all of the following are true:

- [ ] All acceptance criteria in the Linear ticket are met
- [ ] Code is reviewed and approved
- [ ] PR is merged into `main`
- [ ] CI pipeline passes (lint, type-check, tests)
- [ ] Change is deployed to **staging** and manually verified
- [ ] No regressions introduced to existing functionality
- [ ] Linear ticket status is set to **Done**

---

## 7. Project Structure

```
ironlink/
├── apps/
│   ├── mobile/          # React Native / Expo app
│   └── web/             # Next.js web app (Phase 4)
├── packages/
│   ├── api/             # Node.js GraphQL backend
│   ├── db/              # Database schema, migrations (Prisma)
│   └── shared/          # Shared types, constants, utilities
├── .github/
│   ├── workflows/       # CI/CD GitHub Actions
│   └── PULL_REQUEST_TEMPLATE.md
├── CONTRIBUTING.md      # This file
└── README.md
```

* Keep business logic in `packages/` — not inside the mobile or web app
* Shared types must live in `packages/shared` — never duplicate type definitions across apps

---

## 8. Environment & Secrets

### Rules — Non-Negotiable

* **Never commit secrets, API keys, or credentials** to the repository
* `.env` files are **gitignored** at all levels; only `.env.example` is committed
* All secrets are stored in the team password manager and injected via CI/CD

### Required Environment Files

```
apps/mobile/.env.example
packages/api/.env.example
packages/db/.env.example
```

### Clerk-Specific

```bash
# apps/mobile/.env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...   # Safe to expose (public key)

# packages/api/.env
CLERK_SECRET_KEY=sk_...                    # NEVER expose — server only
CLERK_WEBHOOK_SECRET=whsec_...             # NEVER expose — server only
```

---

## 9. Testing

### Expectations

| Layer | Minimum Coverage |
| -- | -- |
| Business logic / utils (`packages/shared`) | ≥ 80% |
| GraphQL resolvers (`packages/api`) | ≥ 70% |
| React Native components | Key user flows covered |

### Test File Location

Tests live **next to the source file** they test:

```
src/
  utils/
    prDetection.ts
    prDetection.test.ts
```

### Running Tests

```bash
npm test              # Run all tests
npm test --workspace=@ironlink/api
```

---

## 10. CI/CD

Every push to any branch and every PR triggers the CI pipeline automatically.

### Pipeline Steps (GitHub Actions)

```
1. Install dependencies (npm ci)
2. Type check (tsc --noEmit)
3. Lint (ESLint)
4. Unit tests (vitest)
5. Build check
```

### Rules

* **A failing CI pipeline blocks merging** — no exceptions
* Fix lint and type errors locally before pushing

---

## 11. Linear Workflow

### Ticket Lifecycle

```
Backlog → Todo → In Progress → In Review → Done
```

| Status | When to set it |
| -- | -- |
| **Todo** | You are picking up the ticket in the current sprint |
| **In Progress** | You have created your branch and started work |
| **In Review** | PR is open and ready for review |
| **Done** | PR is merged, deployed to staging, and manually verified |

### Rules

* **Move the ticket to In Progress** when you create your branch
* **Move to In Review** the moment your PR is marked Ready for Review
* **Never close a ticket manually** — Done status only after full Definition of Done

---

*Last updated: June 2026 — IronLink Product Team*
