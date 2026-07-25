const pool = require("../config/db");

// Upsert one day's count for one platform. Called by the sync job.
async function upsertDailyActivity(userId, platform, date, count) {
  await pool.query(
    `INSERT INTO daily_activity (user_id, platform, activity_date, problems_solved)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, platform, activity_date)
     DO UPDATE SET problems_solved = EXCLUDED.problems_solved`,
    [userId, platform, date, count]
  );
}

// Returns combined (all-platform) daily counts for the heatmap,
// shaped as [{ date: "2025-07-01", count: 3 }, ...]
async function getCombinedHeatmapData(userId) {
  const result = await pool.query(
    `SELECT activity_date AS date, SUM(problems_solved)::int AS count
     FROM daily_activity
     WHERE user_id = $1
     GROUP BY activity_date
     ORDER BY activity_date`,
    [userId]
  );
  return result.rows;
}

module.exports = { upsertDailyActivity, getCombinedHeatmapData };
