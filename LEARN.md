# LEARN.md — The Engineer's Companion to Family Budget Tracker

A teaching document for someone learning to think like a senior software
engineer, using this codebase as the running case study. Every chapter
references real decisions made while building the project — the wins,
the bugs, the things we almost did but talked ourselves out of.

> **Why this document exists.** Junior engineers often only see the
> finished code. The reasoning, the rejected alternatives, the bugs
> that shaped the design — those usually live only in the heads of
> the people who were there. This document tries to capture them.

> **Companion:** [`BUILD_LOG.md`](BUILD_LOG.md) is the chronological
> "what we did and when" — read both. They overlap a little; that's
> intentional.

---

## Table of contents

**Part 1 — The work that happens before any code**
1. Understanding what's actually being asked
2. Researching prior art
3. Architecture decisions and ADRs
4. Designing the data model
5. Building a backlog

**Part 2 — Writing the code**
6. Iteration: walking skeleton over perfect first try
7. Reading errors
8. Debugging
9. Refactoring without breaking things

**Part 3 — Shipping it**
10. Testing strategy
11. CI, type checking, linting
12. Containers, nginx, deployment
13. Observability

**Part 4 — The work that's actually about other humans**
14. Asking better questions of stakeholders
15. Reviewing code
16. Documenting for the right audience
17. Agile in practice

**Part 5 — Codebase tour**
18. Data model and schema conventions
19. Auth: why it's split into two files
20. Server Actions and the validation boundary
21. The dashboard's calculation layer

**Appendices**
- A. Glossary
- B. ADR template
- C. Recommended reading

---

# Part 1 — The work that happens before any code

## 1. Understanding what's actually being asked

The literal ask ("build a budget tracker") is rarely the whole story.
Here, the surface ask hid a sharper one: James and Savanah didn't just
want categories and totals — they wanted to know, on any given day,
whether they were *safe*. That reframing is why the dashboard's job
statement is a question ("are we okay this month, and safe until the
next paycheck?") rather than a feature list. When the ask is vague,
write down the question the finished thing has to answer before
writing any code — it disciplines every later decision (what goes on
the dashboard, what counts as "required," what the safe-to-spend
number actually means).

## 2. Researching prior art

See `BUILD_LOG.md` Chapter 0 — the short version is: don't copy your
own past decisions by default just because they're familiar. James
explicitly asked for current, defensible, professional conventions
over "what I did on my last project," which is why every stack choice
here (Prisma, NextAuth v5, Tailwind v4, Argon2id) is justified on its
own merits in `README.md`, not by precedent.

## 3. Architecture decisions and ADRs

This project doesn't have a formal `docs/adr/` folder yet (small
enough team — two people — that the reasoning lives in `BUILD_LOG.md`
instead). The decisions that would be ADRs if this were a bigger team:

- **Prisma over Drizzle/raw SQL** — typed queries, a real migration
  history, and a schema file that's also documentation, at the cost of
  an extra build step (`prisma generate`) and a driver-adapter
  indirection (see Chapter 1 in `BUILD_LOG.md`).
- **NextAuth v5 (Credentials + JWT), no adapter** — the Prisma
  adapter (`@auth/prisma-adapter`) was installed, then *removed*, once
  it became clear it doesn't fit this app: the Credentials provider is
  fundamentally incompatible with adapter-driven database sessions
  (Auth.js's own docs say so), and this app never needed OAuth account
  linking. Installing a dependency and then reading the docs closely
  enough to remove it again is a normal, healthy part of building
  something — better than leaving unused complexity in because it's
  already there.
- **No income/housing/goal seed data**, even though debts were seeded
  with real numbers. The vault's planning docs simply don't contain
  real income or rent figures, and guessing them would have put fake
  numbers next to real ones with no way to tell them apart later. When
  you don't have real data, leave the gap visible — don't fabricate to
  make a demo look more finished than the underlying information
  actually is.

If this project grows a team beyond two people, start writing real ADR
files (template in Appendix B) for decisions like these — the point of
an ADR isn't ceremony, it's making the "why" survive past the memory
of whoever made the call.

## 4. Designing the data model

Start reading `prisma/schema.prisma` from the bottom comment on
`Debt` — it's the clearest example in this codebase of a general
principle: **a required field in a schema is a claim that the data
always exists.** When you're modeling something messy and real (one
family's actual, incompletely-documented debts), check whether that
claim is actually true before making a field non-nullable. Two fields
here (`balance`, `minimumPayment`) started required and were changed
to nullable specifically because the seed data proved the claim false
— see `BUILD_LOG.md` Chapter 1, Step 3.

The `BillInstance`/`RecurringBill` split (one template, many monthly
instances) is a common pattern for "recurring thing that needs
independent history per occurrence" — look at how `prisma/seed.ts`
creates one `RecurringBill` and then a `BillInstance` per month, and
notice that `BillInstance.name`/`category`/etc. are *copied* from the
template rather than joined at read time. That's deliberate: if you
rename a recurring bill next year, this year's `BillInstance` rows
should still show the name they had when the payment happened.

## 5. Building a backlog

*(Stub — TODO when there's a real backlog/issue tracker to reference
instead of just the original feature list in the approved plan.)*

---

# Part 2 — Writing the code

*(Stub for chapters 6–9 — TODO once there's a debugging story or a
refactor worth writing up. The Prisma non-interactive-migration
workaround in `BUILD_LOG.md` Chapter 1, Step 2 is the closest thing to
a debugging chapter so far.)*

---

# Part 3 — Shipping it

## 10. Testing strategy

Two layers, deliberately not more for an MVP this size:

- **Vitest unit tests** (`src/lib/calculations/dashboard.test.ts`) on
  the pure calculation functions — survival totals, safe-to-spend, and
  debt payoff ordering. These are the functions most likely to have a
  bug that costs real money if wrong, and they're pure (no database,
  no I/O), so they're cheap to test exhaustively. Notice the
  `sortDebtsForPayoff` test deliberately picks APRs and balances that
  *disagree* with each other (see the comment in the test file) — if
  the avalanche and snowball test fixtures happened to sort into the
  same order, a bug that ignored the `strategy` parameter entirely
  would still pass both tests.
- **One Playwright smoke test** (`e2e/login.spec.ts`) — login and
  route-protection only. Not a full e2e suite; the point is catching
  "the app doesn't even start" class failures, not covering every
  flow.

What's *not* tested yet: Server Actions, page rendering, the seed
script's data shape. That's a reasonable gap for an MVP — the plan is
to add coverage as features solidify, not to block shipping on 100%
coverage of code that might still change shape.

## 11. CI, type checking, linting

`.github/workflows/ci.yml` runs, in order: `npm ci` (which triggers
`prisma generate` via the `postinstall` script), `lint`, `typecheck`,
`test`, `build`. Notice `build` doesn't need a live database — every
page that touches Prisma also calls `auth()` (reads cookies), which
Next.js treats as a signal to render dynamically per-request rather
than at build time. That's why `npm run build` worked locally without
Docker running for part of this session's testing.

## 12. Containers, nginx, deployment

`docker-compose.yml` currently covers **local development only** — a
single Postgres service. Production/Unraid deployment (a real
Dockerfile for the Next.js app, a `docker-compose.prod.yml` overlay,
reverse proxy config) is an intentional follow-up, not built yet — see
`docs/PLANNING_SOURCES.md` and the approved plan for why local-first
was the right place to stop for this round.

## 13. Observability

*(Stub — no logging/metrics/error-tracking setup yet. For a
self-hosted, two-user app, start simple: server logs via `docker logs`
are probably sufficient before reaching for anything heavier.)*

---

# Part 4 — The work that's actually about other humans

*(Stub for chapters 14–17 — this project's "stakeholders" so far are
James and Savanah directly, so most of this will fill in once there's
a real back-and-forth to document — e.g. what Savanah says once she
starts using Quick Add on her phone.)*

---

# Part 5 — Codebase tour

## 18. Data model and schema conventions

- Money is always `Decimal` (`@db.Decimal(10, 2)`), never `Float` —
  floating-point rounding errors are unacceptable when the numbers are
  real dollars. `src/lib/decimal.ts`'s `toNumber()` helper is the one
  place Decimal-to-number conversion happens, right at the UI
  boundary — calculations stay on plain numbers (see
  `src/lib/calculations/dashboard.ts`), Prisma stays on Decimal.
- Every table name is explicitly `@@map`'d to `snake_case` (e.g.
  `RecurringBill` → `recurring_bills`) — a common convention so the
  Postgres schema reads naturally in `psql`/`prisma studio` even
  though the TypeScript side uses PascalCase model names.
- `source`/`externalId`/`updatedAt` on every model that could someday
  come from the Google Sheets companion — see
  `docs/GOOGLE_SHEETS_COMPANION.md` for what these are for. They're
  unused today; they exist so a future sync feature doesn't require a
  breaking schema migration on data that already has real history.

## 19. Auth: why it's split into two files

Read `src/auth.config.ts` first (small, Edge-safe), then
`src/auth.ts` (the real thing, Node-only), then `src/middleware.ts`
(imports only the config). The comment at the top of each file
explains why — see also `BUILD_LOG.md` Chapter 1, Step 4 for the full
story of the bug this split prevents.

## 20. Server Actions and the validation boundary

Every file in `src/app/actions/` follows the same shape: parse
`FormData` through a Zod schema from `src/lib/validation/`, then call
Prisma. The Zod schema is the actual security/correctness boundary —
by the time a Server Action calls `prisma.debt.create(...)`, the data
has already been checked. Look at `src/app/actions/debtActions.ts`
alongside `src/lib/validation/debt.ts` to see the pattern end to end,
including the slightly awkward `.toString()` calls (Zod validates
money as a `number` for form-friendliness; Prisma's `Decimal` fields
want a string or `Decimal` instance, so the action layer converts at
the last moment).

## 21. The dashboard's calculation layer

`src/lib/calculations/dashboard.ts` has zero imports from Prisma or
Next.js on purpose — it only knows about plain objects shaped like
`BillLike`/`DebtLike`. `src/app/(app)/page.tsx` does the Prisma
queries and then maps the results into those plain shapes before
calling the calculation functions. This split is what makes
`dashboard.test.ts` possible without a database — the pattern is
worth reusing anywhere else in this codebase that does real math on
money.

---

# Appendix A: Glossary

| Term | Meaning |
|---|---|
| ADR | Architecture Decision Record. Markdown file documenting one decision, its context, alternatives, and consequences. |
| **Server Action** | A Next.js function marked `"use server"` that runs only on the server but can be called directly from a form or client component. |
| **Server Component** | A React component that renders on the server and can `await` data directly — the App Router default. |
| **Driver adapter** | Prisma's mechanism for plugging in a specific database driver instead of its built-in query engine binary. |
| **Edge runtime** | The restricted JavaScript runtime Next.js middleware always runs on — no native Node modules. |

---

# Appendix B: ADR template

Copy into `docs/adr/NNN-title.md`:

```markdown
# ADR-NNN: [Decision title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX

## Context
What's the situation that requires a decision?

## Decision
What did we decide to do?

## Consequences
What gets better? What gets worse? What new questions arise?

## Alternatives considered
Bulleted list with one-line reasoning for each.
```

---

# Appendix C: Recommended reading

- *A Philosophy of Software Design* — John Ousterhout
- *The Pragmatic Programmer* — Hunt & Thomas
- *Refactoring* — Martin Fowler
- *Effective TypeScript* — Dan Vanderkam
- *Staff Engineer* — Will Larson
- *No Silver Bullet* — Fred Brooks (free essay online)
