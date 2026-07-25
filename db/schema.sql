-- Run this once against your PostgreSQL database to set up tables.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('codeforces', 'leetcode', 'codechef', 'gfg')),
    handle VARCHAR(100) NOT NULL,
    total_solved INTEGER DEFAULT 0,
    rating INTEGER DEFAULT 0,
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, platform)
);

CREATE TABLE IF NOT EXISTS daily_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL,
    activity_date DATE NOT NULL,
    problems_solved INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, platform, activity_date)
);

-- Speeds up the heatmap query (sum across platforms per user per day)
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date
    ON daily_activity (user_id, activity_date);

-- Session store table required by connect-pg-simple.
-- connect-pg-simple can also create this automatically at runtime
-- (pass `createTableIfMissing: true` in app.js) if you'd rather skip this.
CREATE TABLE IF NOT EXISTS "session" (
    "sid" VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL
);
