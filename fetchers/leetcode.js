const axios = require("axios");

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

// Gets total solved count (across difficulties) for a handle
const PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`;

// Gets the daily submission heatmap data (unix-day -> count) for a given year
const CALENDAR_QUERY = `
  query userProfileCalendar($username: String!, $year: Int) {
    matchedUser(username: $username) {
      userCalendar(year: $year) {
        submissionCalendar
      }
    }
  }
`;

// Gets the user's contest rating (returns null if they've never entered a contest)
const CONTEST_RATING_QUERY = `
  query userContestRankingInfo($username: String!) {
    userContestRanking(username: $username) {
      rating
    }
  }
`;

async function graphqlRequest(query, variables) {
  const res = await axios.post(
    LEETCODE_GRAPHQL_URL,
    { query, variables },
    {
      headers: {
        "Content-Type": "application/json",
        // LeetCode's GraphQL endpoint rejects requests without a Referer
        Referer: "https://leetcode.com",
      },
    }
  );
  return res.data;
}

/**
 * Same contract as fetchers/codeforces.js:
 * { handle, totalSolved, rating, dailySubmissions: [{date, count}] }
 *
 * `rating` here is LeetCode's contest rating (from userContestRanking).
 * It's 0 if the user has never entered a rated contest — that's normal,
 * not an error, since most people just grind the problem set.
 */
async function fetchUserStats(handle) {
  // 1. Total solved count
  const profileData = await graphqlRequest(PROFILE_QUERY, { username: handle });
  const matchedUser = profileData?.data?.matchedUser;
  if (!matchedUser) {
    throw new Error(`LeetCode handle not found: ${handle}`);
  }
  const totalEntry = matchedUser.submitStats.acSubmissionNum.find(
    (d) => d.difficulty === "All"
  );
  const totalSolved = totalEntry ? totalEntry.count : 0;

  // 2. Contest rating (null if the user has never done a rated contest)
  const contestData = await graphqlRequest(CONTEST_RATING_QUERY, { username: handle });
  const rating = contestData?.data?.userContestRanking?.rating
    ? Math.round(contestData.data.userContestRanking.rating)
    : 0;

  // 3. Submission calendar — LeetCode returns this per calendar year, so
  // pull the current year and the previous year to cover a rolling 12 months.
  const currentYear = new Date().getFullYear();
  const dailyCounts = {};

  for (const year of [currentYear - 1, currentYear]) {
    const calData = await graphqlRequest(CALENDAR_QUERY, { username: handle, year });
    const raw = calData?.data?.matchedUser?.userCalendar?.submissionCalendar;
    if (!raw) continue;

    // submissionCalendar is a JSON string: { "<unixTimestampSeconds>": count, ... }
    const parsed = JSON.parse(raw);
    for (const [unixSeconds, count] of Object.entries(parsed)) {
      const date = new Date(Number(unixSeconds) * 1000).toISOString().slice(0, 10);
      dailyCounts[date] = (dailyCounts[date] || 0) + count;
    }
  }

  const dailySubmissions = Object.entries(dailyCounts).map(([date, count]) => ({
    date,
    count,
  }));

  return {
    handle,
    totalSolved,
    rating,
    dailySubmissions,
  };
}

module.exports = { fetchUserStats };
