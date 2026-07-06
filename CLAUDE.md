# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A private, self-hosted family budget and debt tracker for James and Savanah. Not a generic budgeting app — its first job is answering "are we okay this month, and safe until the next paycheck?" See `docs/PLANNING_SOURCES.md` for the requirements source (an Obsidian vault with the household's real debt data) and `BUILD_LOG.md` Chapter 0 for the full framing.

## Commands

```bash
npm run dev              # start dev server (localhost:3000)
npm run build             # production build
npm run lint               # ESLint
npm run typecheck         # tsc --noEmit
npm run test                # Vitest (unit tests, src/**/*.test.ts)
npm run test:e2e           # Playwright smoke test — needs a running server + E2E_EMAIL/E2E_PASSWORD env vars pointing at a real seeded account

npm run db:migrate        # create + apply a migration (interactive — will fail in non-TTY shells, see below)
npm run db:migrate:deploy # apply existing migrations, non-interactive-safe
npm run db:seed           # seed real household data from the vault (see prisma/seed.ts)
npm run db:studio         # Prisma Studio GUI
npm run db:generate       # regenerate the Prisma client after schema.prisma changes

npm run pwa:icons         # regenerate placeholder PWA icons (public/icons/)
npm run build:wiki        # regenerate BUILD_LOG.html / LEARN.html / WORKFLOW.html from their .md sources
```

Local Postgres: `docker compose up -d` (single `db` service, matches `.env`'s `DATABASE_URL`). Production/Unraid deployment isn't built yet — local dev only for now.

### Running a single test

```bash
npx vitest run src/lib/calculations/dashboard.test.ts
npx playwright test e2e/login.spec.ts
```

### Prisma migrations in non-interactive shells

`prisma migrate dev` refuses to run without a TTY (by design, no bypass flag). If you're scripting a schema change:

1. `npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script > /scratch/diff.sql` (requires `SHADOW_DATABASE_URL` set — see `.env.example`)
2. Review the SQL, then copy it into `prisma/migrations/<timestamp>_<name>/migration.sql`
3. `npx prisma migrate deploy` to apply it non-interactively
4. `npx prisma generate` to regenerate the client

## Architecture

- **Next.js 14, App Router, TypeScript strict.** `src/app/(app)/` is an authenticated route group (middleware-guarded); `src/app/login/` is the only unauthenticated page.
- **Data flow: Server Components read, Server Actions write.** Pages under `src/app/(app)/` are `async` Server Components that query Prisma directly. Mutations go through `src/app/actions/*.ts` — one file per domain (debt, bill, housing, income, transaction, goal, scenario), each validating `FormData` through a matching Zod schema in `src/lib/validation/` before touching Prisma.
- **Auth is split across two files on purpose:**
  - `src/auth.config.ts` — Edge-safe (no Prisma, no argon2). Used by `src/middleware.ts`, which Next.js always runs on the Edge runtime.
  - `src/auth.ts` — full NextAuth config (Credentials provider, Argon2id verification, login lockout). Only ever imported from Node-runtime code (Server Components/Actions, `src/app/api/auth/[...nextauth]/route.ts`).
  - Don't import `@/auth` from anything middleware touches — see `BUILD_LOG.md` Chapter 1, Step 4 for why that breaks.
- **Prisma uses the driver-adapter pattern** (`@prisma/adapter-pg`), not a bare connection string in `schema.prisma` — Prisma 7 requires this. The client generates into `src/generated/prisma/` (gitignored) via the `prisma-client` generator; import from `@/generated/prisma/client` and `@/generated/prisma/enums`, not `@prisma/client` directly.
- **Money is always `Decimal`** in the schema, converted to `number` only at the UI boundary via `src/lib/decimal.ts`'s `toNumber()`. Never use `Float` for money fields.
- **Debt balances/payments are nullable on purpose.** Several real debts in the household's tracker have genuinely unknown balances or payments — the schema represents that as `null`, and the UI renders an "Unknown" badge rather than a fabricated `$0.00`. Don't "fix" this by making the fields required.
- **`src/lib/calculations/`** holds pure, dependency-free functions (survival totals, safe-to-spend, debt payoff ordering) — no Prisma or Next.js imports, so they're cheap to unit test. Pages map Prisma query results into plain objects before calling them; keep it that way rather than inlining the math into a page component.
- **Sync-ready fields** (`source`, `externalId`, `updatedAt`) exist on every model that could eventually come from the planned Google Sheets companion (see `docs/GOOGLE_SHEETS_COMPANION.md`) — unused today, present so that feature doesn't require a breaking migration later.
- **PWA**: `@ducanh2912/next-pwa` (the maintained fork; the original `next-pwa` package has App Router issues) generates `public/sw.js` etc. at build time — those are gitignored. Manifest is `public/manifest.json`; icons are placeholder solid-color PNGs generated by `scripts/generate-pwa-icons.mjs` (swap for real designed icons whenever).

## Working rules

- Work one feature at a time, confirm scope before starting.
- No bank sync, Plaid, external financial APIs, or automatic Google Sheets sync without explicit approval — this is a privacy-first, self-hosted app by design.
- No public internet exposure assumed for MVP (private/Tailscale access).
- When editing schema.prisma, check whether a "required" field's claim ("this always has a value") is actually true for the real household data before making it non-nullable — see the Debt model's comment.

## Teaching docs

This project maintains `BUILD_LOG.md` (chronological), `LEARN.md` (topical), and `meta/teach-as-you-build/WORKFLOW.md` (playbooks), plus HTML versions generated by `npm run build:wiki`. Update all of these whenever a feature lands, a bug is fixed, or an architectural decision is made.
