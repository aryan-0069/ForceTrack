# ForceTrack

Track competitive programming stats across platforms in one combined heatmap.
Phase 1: Codeforces only (auth, sync, heatmap all working end-to-end).

## What to install on your laptop

1. **Node.js** (v18+) — https://nodejs.org (LTS version). Verify with:
   ```
   node -v
   npm -v
   ```
2. **PostgreSQL** (v14+) — https://www.postgresql.org/download/
   - Windows: use the installer, remember the password you set for the `postgres` user.
   - Once installed, you need a GUI or CLI to run SQL — either `psql` (comes with Postgres) or a tool like **pgAdmin** (also comes with the installer) or **DBeaver**.
3. **VS Code** (or your editor of choice) — https://code.visualstudio.com

## Setup steps

### 1. Create the database

Open `psql` or pgAdmin and run:
```sql
CREATE DATABASE cp_aggregator;
```

Then run the schema file against it:
```
psql -U postgres -d cp_aggregator -f db/schema.sql
```
(or paste the contents of `db/schema.sql` into pgAdmin's query tool and execute)

### 2. Install project dependencies

From inside the `cp-aggregator` folder:
```
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env`:
```
cp .env.example .env
```
Then edit `.env` and fill in your actual PostgreSQL username/password/database name in `DATABASE_URL`, e.g.:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/cp_aggregator
```
Set `SESSION_SECRET` to any random long string.

### 4. Run the app

```
npm run dev
```
(uses nodemon, auto-restarts on file changes — install it globally with `npm i -g nodemon` if `npm run dev` complains, or just use `npm start`)

Visit **http://localhost:3000**

## How to test it works

1. Sign up for an account.
2. Go to "Add Platform" → choose Codeforces → enter a real CF handle (e.g. your own, `Aryannn09`).
3. It fetches your submissions live, stores them, and redirects to the dashboard.
4. You should see your solved count, rating, and a heatmap of daily activity.

## What's next (not built yet)

- `fetchers/codechef.js` / `fetchers/gfg.js` — will need Cheerio for scraping since there's no public API.
- Wire new fetchers into `fetchersByPlatform` in `controllers/userController.js` and `jobs/syncCron.js` (one-line addition each — that's the whole point of the shared contract).

## Project structure

```
cp-aggregator/
├── config/       # DB connection, passport strategy, auth middleware
├── controllers/  # Request handlers
├── fetchers/      # Platform-specific data fetchers (codeforces.js done)
├── jobs/         # Cron job for periodic re-sync
├── models/       # SQL queries
├── routes/       # Express route definitions
├── views/        # EJS templates
├── public/       # CSS/JS served statically
└── db/schema.sql # Run this once to set up tables
```
