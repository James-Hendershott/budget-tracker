# GETTING_STARTED.md — Zero to Using It, on PC and Phone

A walkthrough for getting Family Budget Tracker running from a
completely fresh machine, all the way to using it day-to-day on both
your computer and your phone. If you just want the command list with
no explanation, see the "Quick start" section in
[`README.md`](README.md) instead — this document is the slower,
explain-everything version.

> This file, `LEARN.md`, and `BUILD_LOG.md` are automatically mirrored
> into the Obsidian planning vault
> (`D:\James_Journey\projects\active\budget-tracker`) every time Claude
> Code edits them here, via a local `PostToolUse` hook — see
> `.claude/settings.local.json`. Edit the copy in this repo, not the
> vault copy; the vault copy gets overwritten.

---

## Table of contents

1. [What you need installed](#1-what-you-need-installed)
2. [Get the code](#2-get-the-code)
3. [Configure secrets](#3-configure-secrets)
4. [Start the database](#4-start-the-database)
5. [Set up the schema and real data](#5-set-up-the-schema-and-real-data)
6. [Run the app](#6-run-the-app)
7. [Log in on your PC](#7-log-in-on-your-pc)
8. [Use it on your phone](#8-use-it-on-your-phone)
9. [Day-to-day: starting and stopping](#9-day-to-day-starting-and-stopping)
10. [Away from home (not set up yet)](#10-away-from-home-not-set-up-yet)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. What you need installed

Only on the computer you develop/run the server from (your phone
needs nothing installed — it just uses a web browser):

| Tool | Why | Check you have it |
|---|---|---|
| [Node.js](https://nodejs.org) 20+ | Runs the app | `node -v` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Runs the Postgres database in a container | `docker --version` |
| [Git](https://git-scm.com/) | Gets the code, tracks changes | `git --version` |

Docker Desktop specifically needs to be **running** (not just
installed) — it has its own app icon, and you'll see it in your system
tray when it's up. Start it before step 4.

## 2. Get the code

The repo is private on GitHub at
`https://github.com/James-Hendershott/budget-tracker`. Clone it:

```bash
git clone https://github.com/James-Hendershott/budget-tracker.git
cd budget-tracker
npm install
```

`npm install` also runs `prisma generate` automatically afterward
(via a `postinstall` script) — that's expected, not an error.

## 3. Configure secrets

```bash
cp .env.example .env
```

Open `.env` and check it looks like this (the defaults already match
`docker-compose.yml`, so you likely don't need to change
`DATABASE_URL`/`SHADOW_DATABASE_URL`):

```
DATABASE_URL="postgresql://budget_tracker:budget_tracker_dev@localhost:5432/budget_tracker?schema=public"
SHADOW_DATABASE_URL="postgresql://budget_tracker:budget_tracker_dev@localhost:5432/budget_tracker_shadow?schema=public"
AUTH_SECRET="replace-with-a-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a real `AUTH_SECRET` (don't ship the placeholder) — pick
whichever of these you have available:

```bash
openssl rand -base64 32
# or, if you don't have openssl:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Paste the output in as `AUTH_SECRET`. `.env` is gitignored — it never
gets committed, even though the repo itself is private.

## 4. Start the database

```bash
docker compose up -d
```

This starts a single Postgres container (`db`) with a persistent
Docker volume, so your data survives restarts. First run downloads the
Postgres image (~100MB), so it can take a minute. Confirm it's healthy:

```bash
docker compose ps
```

You should see `db` with status `Up` / `healthy`.

## 5. Set up the schema and real data

```bash
npm run db:migrate:deploy   # creates all the tables
npm run db:seed             # seeds real household debts + two accounts
```

The seed script prints the two accounts' passwords to the terminal
**the first time it creates them** — copy those down immediately, they
won't be shown again (re-running the seed later won't reprint them,
since it won't touch existing passwords). If you ever need to reset a
password, do it via `/admin/users` once logged in, or reseed with
`SEED_JAMES_PASSWORD=... SEED_SAVANAH_PASSWORD=... npm run db:seed`
against a fresh database.

## 6. Run the app

```bash
npm run dev
```

Leave this running in its own terminal window — it's the server.
You'll see `Ready in ...` and a `Local: http://localhost:3000` line
once it's up.

## 7. Log in on your PC

Open `http://localhost:3000` in a browser. You'll land on `/login`.
Sign in with one of the two accounts from step 5. You should land on
the dashboard, showing this month's required bills, debts, and a
"safe to spend" number computed from the real seeded debt data.

## 8. Use it on your phone

Two things need to be true for your phone to reach the app: your
phone needs to be **on the same Wi-Fi network** as the computer
running `npm run dev` (this is a local-network-only setup for now —
see [section 10](#10-away-from-home-not-set-up-yet) for the away-from-home plan), and you need
the computer's **local network IP address**, not `localhost` (which
only means "this device" — your phone can't use it to reach your PC).

**Find your PC's local IP:**

- **Windows:** open a terminal and run `ipconfig`, look for
  "IPv4 Address" under your active adapter (usually "Wi-Fi").
- **Mac:** System Settings → Wi-Fi → Details → IP Address (or
  `ipconfig getifaddr en0` in Terminal).

It'll look like `192.168.1.XX`.

**On your phone**, open a browser and go to:

```
http://192.168.1.XX:3000
```

(using your actual IP from above). You should see the same login page.

**Install it as an app (PWA)** so it behaves like a native app —
home-screen icon, full-screen, no browser chrome:

- **iPhone (Safari):** open the site → tap the Share icon (square with
  an arrow) → **Add to Home Screen** → confirm.
- **Android (Chrome):** open the site → tap the **⋮** menu → **Add to
  Home screen** / **Install app** → confirm.

Once installed, launching it from the home screen icon works exactly
like any other app, including a shortcut straight to Quick Add (long-press
the icon on most phones to see it) for logging a transaction fast.

> Your PC needs to stay on and `npm run dev` needs to stay running for
> your phone to reach it this way — this is a development setup, not a
> deployed server. See the next section for always-on access.

## 9. Day-to-day: starting and stopping

To pick back up on a new day:

```bash
docker compose up -d   # if the database container isn't already running
npm run dev
```

To stop for the day: `Ctrl+C` in the `npm run dev` terminal. The
database container can keep running in the background (`docker
compose ps` to check) — no need to stop it between sessions, and your
data stays put either way since it's on a persistent volume.

## 10. Away from home (not set up yet)

Right now the app only works when your phone is on the same Wi-Fi as
the PC running it. Making it reachable from anywhere — your phone on
cellular data, from work, etc. — needs a real deployment, which is an
explicit next step, not done yet:

- Package the app into a Docker container (a production `Dockerfile`)
  and run it continuously on your Unraid server instead of a laptop
  that has to stay awake.
- Reach it privately from anywhere via **Tailscale** (already
  installed on this machine, per the original plan) rather than
  exposing it to the public internet.

Ask to pick this up whenever you're ready — it's tracked as a known
follow-up in `docs/PLANNING_SOURCES.md` and `README.md`.

## 11. Troubleshooting

**`docker compose up -d` fails / hangs.** Docker Desktop isn't
running — open it from the Start menu and wait for the whale icon in
your system tray to stop animating, then retry.

**`npm run db:migrate:deploy` or `db:seed` can't connect.** The
database container probably isn't up yet, or isn't healthy. Run
`docker compose ps` — if `db` isn't listed as healthy, run `docker
compose logs db` to see why.

**Your phone can't reach `http://192.168.1.XX:3000`.** Almost always
one of: phone isn't actually on the same Wi-Fi network (not just the
same building — some networks separate "guest" and "main" Wi-Fi, which
blocks this); Windows Firewall is blocking incoming connections to
port 3000 (allow Node.js through the firewall when prompted, or check
Windows Defender Firewall settings); or the PC's IP changed since you
last checked (re-run `ipconfig`).

**You forgot a password.** There's no self-service "forgot password"
flow yet (a private 2-person app doesn't need one via email). Reset it
directly: `SEED_JAMES_PASSWORD=NewPassword123 npm run db:seed` will
only work if the user doesn't already exist — for an existing user,
reset via Prisma Studio (`npm run db:studio`) is the current path
until an in-app reset flow exists: generate a new Argon2id hash and
update the `users` table's `passwordHash` column by hand, or delete
the user row and reseed.

**Something else broke.** Check the terminal running `npm run dev` for
an error — Next.js error messages usually point at the exact file and
line. If it's a database schema issue, `npm run db:studio` opens a
GUI you can poke around in to see the actual data.
