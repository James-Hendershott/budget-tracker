# Google Sheets companion — planning notes

**Status: not implemented.** This document describes the intended
design so the schema and UI seam (`/admin/google-sheet-sync`) are
ready for it later, without committing to building it now.

## Principle

The app's PostgreSQL database is always the source of truth. Google
Sheets is an optional, manual/admin-triggered companion surface —
important because Savanah isn't especially computer-savvy and may
sometimes prefer editing a spreadsheet over navigating the app. No
live/automatic sync in the MVP; import and export are both explicit,
admin-initiated actions.

## Planned sheet tabs

- Setup Lists
- Monthly Budget Items
- Income Planner
- Housing Payments
- Transactions
- Debts
- Goals
- What If Scenarios
- Sync Log

## Common columns per row

`id`, `month`, `name/item`, `category`, `planned amount`, `actual
amount`, `due date/pull day`, `owner`, `status`, `notes`, `source`,
`last updated`, `synced`.

These map directly onto fields already present on every syncable
Prisma model today: `source` (`APP | SHEET`), `externalId`, and
`updatedAt`. See `prisma/schema.prisma` — `BillInstance`,
`HousingPayment`, `IncomeEntry`, `Transaction`, and `Debt` all have
these fields already, unused, specifically so a future importer has
somewhere real to write `externalId` and detect changes by comparing
`updatedAt`.

## Conflict rule

If a record was edited in both the app and the sheet since the last
sync, **never silently overwrite either side.** Write a `SyncConflict`
row (`prisma/schema.prisma` — `modelName`, `recordId`, `appVersion`,
`sheetVersion`, `status`) and require a human to resolve it from
`/admin/google-sheet-sync`. The `status` field starts at `"REVIEW"`
and moves to `"RESOLVED_APP"` or `"RESOLVED_SHEET"` once an admin
picks a winner.

## MVP behavior today

`/admin/google-sheet-sync` exists as a placeholder page — it explains
sync isn't active yet and shows disabled Import/Export buttons, so the
seam is visible in the nav without pretending the feature works. See
`src/app/(app)/admin/google-sheet-sync/page.tsx`.

## Future behavior (not built)

- Admin can import Sheet rows into the app (create or update, matched
  by `externalId`).
- Admin can export current app data out to a Sheet.
- Conflicting edits are always flagged, never auto-resolved.

Building the actual Google Sheets API integration — including whether
it goes through a service account, OAuth, or the Google MCP connector
available during development — is a separate, explicitly-approved
piece of future work, not part of this MVP.
