const platformAccountModel = require("../models/platformAccountModel");
const dailyActivityModel = require("../models/dailyActivityModel");
const { getTier } = require("../lib/ratingTiers");
const codeforces = require("../fetchers/codeforces");
const leetcode = require("../fetchers/leetcode");

// Maps platform name -> fetcher module, so adding a new platform later
// is just adding one line here.
const fetchersByPlatform = {
  codeforces,
  leetcode,
};

async function getDashboard(req, res) {
  const rawAccounts = await platformAccountModel.getPlatformAccountsForUser(req.user.id);
  const accounts = rawAccounts.map((acc) => ({
    ...acc,
    tier: getTier(acc.platform, acc.rating),
  }));
  const heatmapData = await dailyActivityModel.getCombinedHeatmapData(req.user.id);
  res.render("dashboard", {
    user: req.user,
    accounts,
    heatmapData: JSON.stringify(heatmapData),
    error: null,
  });
}

function getAddPlatform(req, res) {
  res.render("addPlatform", { error: null });
}

async function postAddPlatform(req, res) {
  const { platform, handle } = req.body;

  try {
    const fetcher = fetchersByPlatform[platform];
    if (!fetcher) {
      return res.render("addPlatform", {
        error: `${platform} isn't supported yet.`,
      });
    }

    const stats = await fetcher.fetchUserStats(handle);

    const account = await platformAccountModel.addPlatformAccount(
      req.user.id,
      platform,
      handle
    );
    await platformAccountModel.updateStats(account.id, stats.totalSolved, stats.rating);

    for (const day of stats.dailySubmissions) {
      await dailyActivityModel.upsertDailyActivity(
        req.user.id,
        platform,
        day.date,
        day.count
      );
    }

    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.render("addPlatform", { error: "Couldn't verify that handle. Check spelling and try again." });
  }
}

module.exports = { getDashboard, getAddPlatform, postAddPlatform };
