# BUILD_LOG.md — How Family Budget Tracker Got Built, Step by Step

A chronological build log. Each chapter covers one version (one commit
in the project's git history) and walks through what we built, the
decisions we made, the syntax and patterns we used, and any bugs we
hit along the way.

**Audience:** someone with little or no experience who wants to learn
how a real software project actually comes together. Read top to
bottom — each chapter assumes you've read the ones before it.

**Companion document:** [`LEARN.md`](LEARN.md) is the topical reference
("here's how to think about X"). This document is the narrative
("here's exactly what we did and why, in order").

---

## How to read this

1. **Read sequentially.** Skipping chapters means missing context.
2. **Open the files alongside.** Path references are real — open them
   in your editor while you read.
3. **Try the commands yourself.** Code blocks marked `bash` are
   commands you can run.
4. **It's OK to not understand everything on first pass.** Some
   concepts are introduced briefly here and unpacked further in
   `LEARN.md`. Use the cross-references.
5. **Glossary at the end.** Anytime a term appears in **bold italic**,
   it's defined in the glossary.

---

## Table of contents

- [Chapter 0 — Before any code: understanding the ask](#chapter-0--before-any-code-understanding-the-ask)
- [Chapter 1 — v0.1.0: Scaffolding the MVP](#chapter-1--v010-scaffolding-the-mvp)
- (Append chapters as the project grows)

---

# Chapter 0 — Before any code: understanding the ask

## The ask

James and his wife Savanah have been trying to manage their household
budget by hand, and it's been hard to keep everything captured and
organized — what's required each month, what's already been paid, and
what has to be covered before the next paycheck. James asked for a
private, self-hosted "family survival-budget tracker": not a generic
budgeting app, but something whose first job is answering *"are we
okay this month, and safe until the next paycheck?"*

The real numbers already existed as planning notes in an Obsidian
vault (`tracked_debt_summary.md`, `debt_consolidation_plan_summary.md`)
— fifteen-plus real debts, a Prosper consolidation loan offer, medical
payment plans, and a list of what's still unknown (the loan servicer's balance,
a couple of unconfirmed Amazon installment balances). That vault is
the requirements source for this app; see
[`docs/PLANNING_SOURCES.md`](docs/PLANNING_SOURCES.md).

## What's the actual problem

Beyond "track the budget," the real problem was **visibility under
stress**. Debts were scattered across cards, payment plans, and BNPL
installments with different due dates and partial information. The
household needed one place that could say, truthfully, what's still
owed, what's unknown and needs confirming, and what's safe to spend —
without hiding the gaps in the data behind fake zeros.

Explicitly out of scope for the MVP: bank sync, Plaid, any external
financial API, and automatic Google Sheets sync. This is a
privacy-first tool by design.

## Researching prior art

James has built several personal apps before (an inventory PWA, a
family task-tracking app, a property-comparison tool), each with its
own stack choices. Rather than copy those choices by default, James
asked explicitly for **current, real-world professional conventions**
— he's still learning to code and wanted the reasoning to hold up on
its own, not "because that's what I did last time." Every stack choice
in this project is justified independently in
[`README.md`](README.md#tech-stack) and the approved implementation
plan, not inherited.

## The design that fell out

- **Next.js 14 (App Router) + TypeScript**, Server Components and
  Server Actions as the default data flow — no separate REST API layer
  for a single-app, two-user product.
- **PostgreSQL + Prisma** for the data model, chosen for typed queries
  and a real migration history over a hand-rolled query layer.
- **NextAuth v5 (Auth.js) + Argon2id**, not hand-rolled auth — a
  finance app is exactly the kind of thing where a subtly wrong
  session-cookie or CSRF implementation is expensive to get wrong.
- **Tailwind CSS v4 + shadcn/ui** for styling — components you own the
  source of, built on accessible Radix primitives.
- **Docker (local dev now, Unraid production later)** — self-hosted,
  no cloud dependency, matching the privacy-first requirement.
- Every "syncable" data model (debts, bills, transactions, etc.) got
  `source`/`externalId`/`updatedAt` fields from day one, even though
  Google Sheets sync isn't built yet — see Chapter 1's "unknowns are
  data, not zeros" section for why this mattered immediately, not
  hypothetically.

## Chapter takeaways

- A good first step for any app handling someone's real, messy data is
  asking "what do we know, what don't we know, and how do we represent
  'don't know' honestly?" — this shaped the schema before a single
  page was built.
- Stack choices should be defensible on their own merits. If you can't
  explain *why* a library beats the alternative, that's a sign to
  research before choosing, not after.

---

# Chapter 1 — v0.1.0: Scaffolding the MVP

> 📌 **What this chapter teaches.** Next.js App Router project
> structure, Prisma's newer driver-adapter architecture, why
> middleware and auth logic sometimes need to be split in two files,
> Tailwind v4's CSS-first theming, and Argon2id password hashing.

## The ask

Build the actual project scaffolding: a Next.js app, the full
database schema, a page for every MVP feature (dashboard, income,
bills, housing, transactions, debts, goals, what-if scenarios, admin),
seeded with the household's real debt data, with working
authentication — not a bare "hello world," a working first cut.

## The plan

Follow the approved implementation plan step by step: scaffold the
Next.js app, wire up Prisma against a local Docker Postgres, add
NextAuth with Argon2id, write Zod validation for every domain model,
build the page structure, add a PWA manifest/service worker, and set
up Vitest + a Playwright smoke test + CI.

## Step 1: Scaffolding and the version-drift problem

`create-next-app@14` and `npx shadcn@latest init` were run back to
back, expecting them to agree on tooling versions. They didn't: the
Next.js template installed **Tailwind v3**, but the *current* shadcn
CLI (`shadcn@4.13.0`) generates CSS built for **Tailwind v4** (CSS-first
`@theme` blocks instead of a `tailwind.config.ts` content-scanning
setup). The build failed with `Cannot apply unknown utility class
'border-border'` — a real symptom of "two tools that assume different
major versions of a third tool."

The fix was to upgrade to Tailwind v4 rather than fight the v3 config
into shape, since v4 is what the current tooling actually targets:

```bash
npm install tailwindcss@latest @tailwindcss/postcss@latest
```

```css
/* src/app/globals.css — v4 uses a single import, not three @tailwind directives */
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
```

Even after that, the CLI's generated `globals.css` was still missing
the `@theme inline` block that maps custom properties like `--border`
to the actual utility class `border-border`. That block had to be
added by hand (see `src/app/globals.css`) — the CLI defined the *color
values* but not the *theme mapping* connecting them to Tailwind's
utility generator. **Lesson:** when a generator produces "almost
working" output, read the error literally — "unknown utility class"
meant a mapping was missing, not that the color was wrong.

## Step 2: Prisma's driver-adapter architecture

`npm install prisma` pulled Prisma 7, whose `schema.prisma` no longer
accepts a `url` directly in the `datasource` block — that's now
Prisma-config-only, and the running app must pass a **driver adapter**
(`@prisma/adapter-pg`) into `PrismaClient` explicitly:

```ts
// src/lib/prisma.ts
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
```

This matters because it decouples *which* database driver runs your
queries from Prisma's query engine — useful for edge/serverless
deployments that need a different connection strategy, though this app
just uses the standard Node `pg` driver.

Prisma also refuses to run `migrate dev` in a **non-interactive**
shell at all (no bypass flag) — it's designed to prompt a human. The
workaround: generate the SQL diff with `prisma migrate diff --script`
into a scratch file first, review it, then hand-write it into a
`prisma/migrations/<timestamp>_<name>/migration.sql` folder and apply
with `prisma migrate deploy`, which *is* safe to run unattended. This
needed a **shadow database** (a scratch Postgres database Prisma uses
to compute the diff) — created with one `CREATE DATABASE` statement
and pointed to via `SHADOW_DATABASE_URL` in `prisma.config.ts`.

## Step 3: Unknowns are data, not zeros

The real debt tracker has entries like the loan servicer's student loan (payment
known, balance and APR genuinely unknown) and one Amazon installment
plan where *neither* the balance nor the payment is confirmed. The
schema's first draft made `Debt.balance` and `Debt.minimumPayment`
required — which would have forced seeding fake `$0` values, silently
lying about the household's real exposure.

Fixed by making both fields nullable, with the UI rendering an
"Unknown" badge instead of `$0.00` (see `src/app/(app)/debts/page.tsx`).
**Lesson:** "we don't know yet" is a real, distinct state from "zero"
— modeling it honestly costs one `?` in the schema and pays for itself
the first time someone almost trusts a wrong number.

## Step 4: Splitting auth config for the Edge runtime

Next.js **always** runs `middleware.ts` on the Edge runtime — there's
no opt-out in Next 14. The Edge runtime can't load `argon2` (native
Node bindings) or the Postgres driver Prisma's adapter needs. Writing
the full NextAuth config (Credentials provider, Prisma lookups, argon2
verification) directly into a file imported by `middleware.ts` would
have shipped code that crashes the moment the app tries to run it at
the edge.

The fix, and the standard Auth.js pattern for this exact problem: split
the config in two.

- `src/auth.config.ts` — Edge-safe. Only the `pages` config and an
  `authorized()` callback that reads the already-decoded session and
  decides redirect/allow. No Prisma, no argon2, no providers.
- `src/auth.ts` — full config, Credentials provider, Prisma lookups,
  Argon2id verification. Only ever imported from Node-runtime code
  (Server Components, Server Actions, the `/api/auth` route handler).
- `middleware.ts` builds its `NextAuth(...)` instance from
  `auth.config.ts` alone.

**Lesson:** "where does this code run" is not a detail — Next.js has
(at least) two different JavaScript runtimes in the same app, with
different capabilities, and a middleware file silently pulling in the
wrong dependency graph is a real, easy-to-hit failure mode.

## Step 5: Argon2id over bcrypt, and a self-hosted lockout

Password hashing used **Argon2id** rather than the more commonly-seen
bcrypt — it's OWASP's current first recommendation for new
applications. Failed logins are tracked directly on the `User` row
(`failedLoginAttempts`, `lockedUntil`) rather than reaching for an
external rate-limiting service, since this is a self-hosted app with
no external dependencies by design:

```ts
if (!passwordValid) {
  const failedLoginAttempts = user.failedLoginAttempts + 1;
  const lockingOut = failedLoginAttempts >= MAX_FAILED_ATTEMPTS;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: lockingOut ? 0 : failedLoginAttempts,
      lockedUntil: lockingOut ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null,
    },
  });
  return null;
}
```

## Bugs we hit

- **`next/font/google` didn't recognize `Geist`** in this Next.js
  version. Fixed by using Vercel's official `geist` npm package
  (`geist/font/sans`) instead of `next/font/google`, which is the more
  current, version-independent way to use that font anyway.
- **Two competing font declarations**: the create-next-app template
  had already wired up local Geist `.woff` files that the shadcn CLI's
  Google-font import silently duplicated. Removed the unused local
  font files and settled on one source of truth.
- **Playwright's first assertion failed** on a cold dev server — Next
  dev mode compiles a route on its *first* request, and that took
  longer than Playwright's default 5-second assertion timeout. Not an
  app bug; fixed by bumping `expect.timeout` in `playwright.config.ts`
  to 10s, since this test is meant to run against whatever server is
  already up (dev's on-demand compilation included).
- **The seed script printed a password that didn't match what was
  actually stored**, on the second and later runs. `prisma.user.upsert`
  was written with `update: {}` — correct, since it should never
  silently reset an existing user's real password — but the *console
  message* generated a fresh random password and printed it
  unconditionally, regardless of whether the upsert took the create or
  update path. Re-running `npm run db:seed` after the first real seed
  would print a brand-new "temp password" that was never actually
  hashed into the database. Caught during the final verification pass
  by re-seeding and noticing the printed password no longer matched a
  known-working login. Fixed by checking for an existing user with
  `findUnique` *before* generating/hashing/printing a password at all
  — see `upsertUserWithPassword()` in `prisma/seed.ts`. **Lesson:** a
  script that's safe to re-run (idempotent) isn't the same as a script
  whose *output* stays truthful on every re-run — check both, and
  verify by actually re-running it, not just reading the logic.

## Verifying

- `npm run build` — clean production build, all routes correctly
  marked dynamic (server-rendered per request, since they read the
  session and query Prisma) rather than statically prerendered.
- `npm run lint` / `npm run typecheck` / `npm run test` — all clean.
- Logged in as the real seeded James account via `curl` against the
  NextAuth credentials callback, confirmed the session JWT carried the
  right role/person, confirmed `/`, `/debts`, `/bills` render real
  seeded data, and confirmed the lockout actually triggers after 5 bad
  passwords and blocks even the *correct* password until it expires.
- Playwright smoke test (`e2e/login.spec.ts`) passes: login → redirect
  to dashboard → core sections visible; unauthenticated visit to
  `/bills` redirects to `/login`.

## Chapter takeaways

- When two tools disagree on a dependency's major version, resolve the
  disagreement explicitly (upgrade or pin) rather than patching around
  the symptom — the symptom will resurface elsewhere.
- A field being "required" in a schema is a claim about the world. If
  the real world sometimes doesn't have that data, the schema should
  say so with `?`, not force a placeholder value that looks like data.
- Middleware in Next.js runs somewhere more restricted than the rest
  of your app — check what it can and can't import before your auth
  logic ends up there by accident.
- Picking the *current* recommended security primitive (Argon2id) is
  as easy as picking last decade's (bcrypt) — the only cost is
  spending five minutes checking what's current.
- "Safe to re-run" and "truthful on every re-run" are different
  properties — a script can correctly avoid overwriting data while its
  *logging* still lies about what happened. Verify a script by
  actually running it twice, not by reading its logic once.

---

# How future chapters will get added

Going forward, every commit that adds a feature, fixes a bug, or makes
a notable change gets a new chapter appended here. The chapter format:

```markdown
# Chapter N — vX.Y.Z: [Title]

> 📌 **What this chapter teaches.** [Concepts/syntax newly introduced]

## The ask
## The plan
## Step 1: [Thing]
## Step 2: [Thing]
## Bugs we hit (if any)
## Verifying
## Chapter takeaways
```

---

# Glossary

| Term | Meaning |
|---|---|
| **Server Action** | A Next.js function marked `"use server"` that runs only on the server but can be called directly from a form or client component, without hand-writing an API route. |
| **Server Component** | A React component that renders on the server and can `await` data (e.g. a Prisma query) directly in its body — the App Router default. |
| **Driver adapter** | Prisma's mechanism for plugging in a specific database driver (e.g. `@prisma/adapter-pg` for `pg`) instead of Prisma's built-in query engine binary talking to the DB itself. |
| **Edge runtime** | A restricted JavaScript runtime (used by Next.js middleware) that doesn't support native Node modules like `argon2` or many Node built-ins. |
| **Argon2id** | A password-hashing algorithm; OWASP's current top recommendation, designed to resist both GPU-cracking and side-channel attacks better than older algorithms like bcrypt. |
| **Shadow database** | A scratch database Prisma uses internally to compute the SQL difference between your current schema and your migration history — never touched by the running app. |

---

*This is a living document. Each release adds a chapter.*
