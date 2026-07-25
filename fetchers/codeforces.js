const axios = require("axios");

/**
 * Every fetcher must return this shape:
 * {
 *   handle: string,
 *   totalSolved: number,
 *   rating: number,
 *   dailySubmissions: [{ date: "YYYY-MM-DD", count: number }]
 * }
 */
async function fetchUserStats(handle) {
  // 1. Basic profile info (rating)
  const infoRes = await axios.get(
    `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`
  );
  if (infoRes.data.status !== "OK") {
    throw new Error(`Codeforces handle not found: ${handle}`);
  }
  const rating = infoRes.data.result[0].rating || 0;

  // 2. Full submission history
  const statusRes = await axios.get(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`
  );
  if (statusRes.data.status !== "OK") {
    throw new Error(`Could not fetch submissions for: ${handle}`);
  }
  const submissions = statusRes.data.result;

  // 3. Keep only accepted submissions, dedupe by problem (so retries don't inflate count)
  const solvedProblemIds = new Set();
  const dailyCounts = {}; // { "YYYY-MM-DD": count }

  for (const sub of submissions) {
    if (sub.verdict !== "OK") continue;

    const problemId = `${sub.problem.contestId}-${sub.problem.index}`;
    if (solvedProblemIds.has(problemId)) continue; // already counted this problem
    solvedProblemIds.add(problemId);

    const date = new Date(sub.creationTimeSeconds * 1000)
      .toISOString()
      .slice(0, 10); // "YYYY-MM-DD"

    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  }

  const dailySubmissions = Object.entries(dailyCounts).map(([date, count]) => ({
    date,
    count,
  }));

  return {
    handle,
    totalSolved: solvedProblemIds.size,
    rating,
    dailySubmissions,
  };
}

module.exports = { fetchUserStats };
