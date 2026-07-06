# Family Budget Tracker

A private, self-hosted household budget and debt tracker. Not a generic
budgeting app — its first job is answering *"are we okay this month,
and safe until the next paycheck?"*

Requirements come from a real household's debt/consolidation planning
notes (see [`docs/PLANNING_SOURCES.md`](docs/PLANNING_SOURCES.md)),
and the dev database is seeded with fictional demo data shaped the
same way so the dashboard means something from day one — see
[`BUILD_LOG.md`](BUILD_LOG.md) for the full story of how this was
built, and [`LEARN.md`](LEARN.md) for the reasoning behind the stack
choices below.

**New here?** [`GETTING_STARTED.md`](GETTING_STARTED.md) is the full
walkthrough — from a completely fresh machine to logging in on your
PC and installing it as an app on your phone. The "Quick start" below
is the condensed command list for anyone who just wants to move fast.

## Quick start

```bash
npm install                # installs deps, then runs `prisma generate` via postinstall
cp .env.example .env       # fill in AUTH_SECRET (openssl rand -base64 32)
docker compose up -d       # starts local Postgres
npm run db:migrate:deploy  # apply migrations
npm run db:seed            # seed demo data + two accounts (prints temp passwords)
npm run dev                # http://localhost:3000
```

Both seeded accounts are printed to the console the first time you
seed — change them from `/admin/users` (or reseed with
`SEED_JAMES_PASSWORD=... SEED_SAVANAH_PASSWORD=... npm run db:seed`)
before this ever leaves your machine.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14, App Router, TypeScript strict | Current official Next.js architecture; Server Components + Server Actions avoid hand-writing a separate REST API for a single-app product. |
| Database | PostgreSQL + Prisma (driver-adapter pattern, `@prisma/adapter-pg`) | Typed queries, real migration history, `Decimal` support for money. Prisma 7 requires a driver adapter rather than a bare connection string. |
| Auth | NextAuth v5 (Auth.js), Credentials provider, Argon2id hashing | A finance app shouldn't hand-roll session/CSRF handling. Argon2id is OWASP's current top password-hashing recommendation. No adapter — Credentials + JWT sessions don't need one, and this app has exactly two fixed accounts, no OAuth. |
| Validation | Zod | Every Server Action parses `FormData` through a schema before touching Prisma — the actual trust boundary. |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix primitives) | Components you own the source of, accessible by default (ARIA roles, keyboard nav, focus management from Radix). |
| PWA | `@ducanh2912/next-pwa` | The actively-maintained fork; the original `next-pwa` has known App Router issues. Mobile-first matters here — Savanah's primary workflow is her phone. |
| Testing | Vitest (unit) + Playwright (smoke) | Unit tests target the pure money-math functions in `src/lib/calculations/` — the code most likely to have a bug that costs real money if wrong. |
| Self-hosting | Docker (local dev now; Unraid production is a documented follow-up) | Privacy-first — no bank sync, no external financial APIs, no cloud dependency, by design. |

## Project structure

```
src/
  app/
    login/                 # unauthenticated
    (app)/                 # authenticated route group (middleware-guarded)
      page.tsx             # dashboard — the "are we okay this month" screen
      income/ bills/ housing/ transactions/ debts/ goals/ scenarios/
      admin/users/ admin/google-sheet-sync/
    actions/                # Server Actions, one file per domain
    api/auth/[...nextauth]/ # NextAuth route handler
  auth.ts                  # full NextAuth config (Node runtime only)
  auth.config.ts           # Edge-safe subset, used by middleware.ts
  middleware.ts            # route protection (Edge runtime)
  lib/
    calculations/          # pure, dependency-free money math (unit tested)
    validation/             # Zod schemas, one per domain model
    prisma.ts              # Prisma client singleton (driver adapter)
    env.ts                 # Zod-validated environment variables
    decimal.ts              # Prisma Decimal → number, at the UI boundary only
  generated/prisma/        # generated Prisma client (gitignored)
prisma/
  schema.prisma
  seed.ts                  # seeds fictional demo debt data, shaped like the vault's real tracker
  migrations/
docs/
  PLANNING_SOURCES.md
  GOOGLE_SHEETS_COMPANION.md
meta/teach-as-you-build/
  WORKFLOW.md               # setup/daily-work/deploy/troubleshoot playbooks
  build-wiki.mjs            # regenerates BUILD_LOG.html / LEARN.html / WORKFLOW.html
```

## Privacy

No bank sync, Plaid, external financial APIs, or automatic Google
Sheets sync — none of that gets added without explicit approval. See
[`docs/GOOGLE_SHEETS_COMPANION.md`](docs/GOOGLE_SHEETS_COMPANION.md)
for the planned (manual, admin-triggered) Sheets companion. No public
internet exposure is assumed for the MVP — private/Tailscale access
only.
