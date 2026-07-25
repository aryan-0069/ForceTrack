# ForceTrack

A full-stack web app that aggregates competitive programming stats from multiple judges (currently **Codeforces** and **LeetCode**) into a single dashboard — one combined heatmap of daily solving activity, rating tiers, and solve counts, instead of checking four different profiles.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Express](https://img.shields.io/badge/Express-4.x-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue)

---

## Features

- **Email/password auth** — signup, login, logout via Passport.js (local strategy) with bcrypt password hashing, sessions persisted in PostgreSQL.
- **Multi-platform aggregation** — link your Codeforces and LeetCode handles; the app pulls solved-problem counts, rating, and daily submission history for each.
- **Combined activity heatmap** — daily solve counts from every linked platform, merged into a single GitHub-style calendar heatmap with "Older / Newer" navigation to browse your full history, not just the last 12 months.
- **Rating tiers** — stat cards are color-coded using real CP rank conventions (Newbie → Pupil → ... → Grandmaster for Codeforces; an equivalent scale for LeetCode contest rating).
- **Automatic background sync** — a cron job (`node-cron`) re-fetches every linked account's stats every few hours, so the dashboard stays current without the user doing anything.
- **Extensible fetcher architecture** — every platform integration implements the same `fetchUserStats(handle)` contract, so adding a new platform (CodeChef, GFG, etc.) means writing one new file, not touching the rest of the app.

---

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express.js |
| Templating | EJS (server-rendered views) |
| Database | PostgreSQL |
| Auth | Passport.js (local strategy), bcrypt, express-session + connect-pg-simple |
| Scheduling | node-cron |
| HTTP client | axios |
| Heatmap | cal-heatmap.js + d3 |
| Styling | Custom CSS (no framework) — dark theme, JetBrains Mono / Inter |

---

## Architecture

```
Browser (EJS-rendered pages)
        │
        ▼
Express routes → controllers → models → PostgreSQL
        │
        ▼
  fetchers/  (codeforces.js, leetcode.js, ...)
        │
        ▼
  External platform APIs (Codeforces REST API, LeetCode GraphQL)

Background: jobs/syncCron.js runs every 3 hours,
loops all platform_accounts, calls the matching fetcher,
and upserts fresh data into the database.
```

### Data flow for "Add Platform"
1. User submits a handle + platform on `/add-platform`.
2. Controller looks up the matching fetcher (`fetchersByPlatform[platform]`) and calls it live to validate the handle exists.
3. On success: the handle is saved to `platform_accounts`, and the returned stats are written to `platform_accounts` (totals) and `daily_activity` (per-day counts).
4. User is redirected to `/dashboard`, which reads back from the DB (never re-fetches on page load — see below).

### Why the DB is the source of truth for page loads
The dashboard never hits Codeforces/LeetCode directly on render — it only reads from PostgreSQL. All fetching happens at "Add Platform" time (once) and via the cron job (periodically). This avoids rate-limiting from the judges and keeps dashboard loads fast.

---

## Database schema

- **`users`** — id, email, password_hash
- **`platform_accounts`** — one row per (user, platform) pair: handle, total_solved, rating, last_synced_at
- **`daily_activity`** — one row per (user, platform, date): problems_solved — this is what the heatmap query aggregates (`SUM(problems_solved) GROUP BY date`)
- **`session`** — managed by `connect-pg-simple`, stores login sessions

Full definitions in [`db/schema.sql`](./db/schema.sql).

---

## Project structure

```
cp-aggregator/
├── config/
│   ├── db.js              # PostgreSQL connection pool
│   ├── passport.js        # Passport local strategy
│   └── ensureAuth.js       # Route-protection middleware
├── controllers/
│   ├── authController.js  # signup / login / logout
│   └── userController.js  # dashboard, add-platform
├── fetchers/
│   ├── codeforces.js      # Codeforces REST API integration
│   └── leetcode.js        # LeetCode GraphQL integration
├── jobs/
│   └── syncCron.js        # Periodic re-sync of all linked accounts
├── lib/
│   └── ratingTiers.js     # Maps rating → CP tier label/color
├── models/
│   ├── userModel.js
│   ├── platformAccountModel.js
│   └── dailyActivityModel.js
├── routes/
│   ├── authRoutes.js
│   └── userRoutes.js
├── views/                 # EJS templates
├── public/css/style.css   # Custom dark theme
├── db/schema.sql
├── .env.example
└── app.js
```

---

## The fetcher contract

Every platform integration returns the same shape, so the rest of the app (DB writes, cron job, dashboard rendering) doesn't care which platform the data came from:

```js
{
  handle: "tourist",
  totalSolved: 700,
  rating: 3900,
  dailySubmissions: [
    { date: "2025-07-01", count: 3 },
    { date: "2025-07-02", count: 1 },
    ...
  ]
}
```

To add a new platform: create `fetchers/<platform>.js` exporting `fetchUserStats(handle)` in this shape, then register it in the `fetchersByPlatform` map in both `controllers/userController.js` and `jobs/syncCron.js`.

---

## Setup

### Prerequisites
- [Node.js](https://nodejs.org) v18+
- [PostgreSQL](https://www.postgresql.org/download/) v14+

### 1. Create the database
```sql
CREATE DATABASE cp_aggregator;
```
```
psql -U postgres -d cp_aggregator -f db/schema.sql
```

### 2. Install dependencies
```
npm install
```

### 3. Configure environment variables
```
cp .env.example .env
```
Edit `.env`:
```
PORT=3000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/cp_aggregator
SESSION_SECRET=some_random_long_string
```

### 4. Run
```
npm run dev
```
Visit **http://localhost:3000**

---

## Roadmap

- [ ] CodeChef fetcher (requires scraping — no public API)
- [ ] GeeksforGeeks fetcher (same)
- [ ] Per-platform breakdown on the heatmap (currently combined-only)
- [ ] Incremental sync (only fetch submissions since `last_synced_at` instead of full history every time)
- [ ] Public shareable profile pages

---

## License

MIT — do whatever you want with it.
