const pool = require("../config/db");

async function addPlatformAccount(userId, platform, handle) {
  const result = await pool.query(
    `INSERT INTO platform_accounts (user_id, platform, handle)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, platform) DO UPDATE SET handle = EXCLUDED.handle
     RETURNING *`,
    [userId, platform, handle]
  );
  return result.rows[0];
}

async function getPlatformAccountsForUser(userId) {
  const result = await pool.query(
    "SELECT * FROM platform_accounts WHERE user_id = $1 ORDER BY platform",
    [userId]
  );
  return result.rows;
}

async function getAllPlatformAccounts() {
  const result = await pool.query("SELECT * FROM platform_accounts");
  return result.rows;
}

async function updateStats(id, totalSolved, rating) {
  await pool.query(
    `UPDATE platform_accounts
     SET total_solved = $1, rating = $2, last_synced_at = NOW()
     WHERE id = $3`,
    [totalSolved, rating, id]
  );
}

module.exports = {
  addPlatformAccount,
  getPlatformAccountsForUser,
  getAllPlatformAccounts,
  updateStats,
};
