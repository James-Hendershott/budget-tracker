# Planning sources

This app's requirements come from an Obsidian vault, not from this
repo:

```
D:\James_Journey\projects\active\budget-tracker
```

That vault is **planning-only** — notes, specs, and decision records.
It is not moved or copied into this repo; treat it as a live source
document, not a frozen snapshot. Two files there are the most directly
load-bearing for this app's data model:

- `tracked_debt_summary.md` — every recurring debt/bill currently
  tracked, known balances, and an explicit "unknown or incomplete
  debts" section. `prisma/seed.ts` mirrors this file's shape (debt
  types, unknown-field patterns, consolidation strategies) using
  fictional demo figures rather than the real numbers.
- `debt_consolidation_plan_summary.md` — analysis of a Prosper
  consolidation loan offer against the tracked debts, including which
  debts are good/bad consolidation candidates. This shaped the `Debt`
  model's `strategy` field (`MINIMUM_ONLY | AVALANCHE | SNOWBALL |
  CONSOLIDATION_CANDIDATE | HOLD`) and the seeded `strategy` values.

The vault's own `CLAUDE.md` also documents the full product direction
(primary goals, technical direction, Google Sheets companion plan) —
this repo's `README.md` and `docs/GOOGLE_SHEETS_COMPANION.md`
summarize the parts relevant to writing code here, but the vault is
the canonical source if the two ever disagree.

## When the vault changes

If a debt's balance, APR, or status changes in the vault, that's a
signal to update the corresponding row via the app's UI (or, for bulk
changes, `prisma/seed.ts` and a fresh `npm run db:seed`) — not to
silently let the two sources drift apart.
