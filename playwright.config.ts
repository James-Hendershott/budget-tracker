import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  // Next.js dev mode compiles routes on first hit — can blow past the
  // 5s default on a cold server. Bumped rather than switching to
  // `next start` here, since this is meant to run against whatever
  // server is already up (dev or prod).
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
  },
  // Assumes `npm run dev` (or a prod server) is already running against a
  // seeded database — this is a smoke test, not a full e2e harness with
  // its own server lifecycle/fixtures.
});
