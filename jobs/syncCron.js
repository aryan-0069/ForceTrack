const cron = require("node-cron");
const platformAccountModel = require("../models/platformAccountModel");
const dailyActivityModel = require("../models/dailyActivityModel");
const codeforces = require("../fetchers/codeforces");
const leetcode = require("../fetchers/leetcode");

const fetchersByPlatform = {
  codeforces,
  leetcode,
};

async function syncAllAccounts() {
  console.log("[sync] starting sync run...");
  const accounts = await platformAccountModel.getAllPlatformAccounts();

  for (const account of accounts) {
    try {
      const fetcher = fetchersByPlatform[account.platform];
      if (!fetcher) continue; // platform not implemented yet (codechef, gfg)

      const stats = await fetcher.fetchUserStats(account.handle);
      await platformAccountModel.updateStats(account.id, stats.totalSolved, stats.rating);

      for (const day of stats.dailySubmissions) {
        await dailyActivityModel.upsertDailyActivity(
          account.user_id,
          account.platform,
          day.date,
          day.count
        );
      }
      console.log(`[sync] updated ${account.handle} (${account.platform})`);
    } catch (err) {
      console.error(`[sync] failed for ${account.handle}:`, err.message);
    }
  }
  console.log("[sync] run complete.");
}

function startCron() {
  // Runs every 3 hours. Adjust the schedule as you like: https://crontab.guru
  cron.schedule("0 */3 * * *", syncAllAccounts);
  console.log("[sync] cron scheduled to run every 3 hours");
}

module.exports = { startCron, syncAllAccounts };
