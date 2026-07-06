import { test, expect } from "@playwright/test";

/// Smoke test only: log in and confirm the dashboard renders its core
/// sections. Needs a running dev/prod server against a seeded database,
/// and E2E_EMAIL/E2E_PASSWORD pointing at a real seeded account (run
/// `SEED_JAMES_PASSWORD=... npm run db:seed` to pin a known password).
/// Skips itself if those aren't set rather than failing CI on missing
/// config.
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.skip(!email || !password, "E2E_EMAIL/E2E_PASSWORD not set");

test("login redirects to dashboard with core sections visible", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("Safe to spend")).toBeVisible();
  await expect(page.getByText("Monthly survival total")).toBeVisible();
});

test("unauthenticated visitors are redirected to /login", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/bills");
  await expect(page).toHaveURL(/\/login/);
});
