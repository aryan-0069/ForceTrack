// Maps a rating to a competitive-programming-style tier (label + color).
// Codeforces thresholds are the real, well-known ones (simplified: collapsing
// Master/International Master/Grandmaster variants into single tiers).
// LeetCode contest rating uses a different scale, so it gets its own buckets.

const CF_TIERS = [
  { max: 1199, label: "Newbie", color: "var(--tier-gray)" },
  { max: 1399, label: "Pupil", color: "var(--tier-green)" },
  { max: 1599, label: "Specialist", color: "var(--tier-cyan)" },
  { max: 1899, label: "Expert", color: "var(--tier-blue)" },
  { max: 2099, label: "Candidate Master", color: "var(--tier-violet)" },
  { max: 2299, label: "Master", color: "var(--tier-orange)" },
  { max: Infinity, label: "Grandmaster", color: "var(--tier-red)" },
];

const LEETCODE_TIERS = [
  { max: 1399, label: "Unrated", color: "var(--tier-gray)" },
  { max: 1599, label: "Rookie", color: "var(--tier-green)" },
  { max: 1799, label: "Competitor", color: "var(--tier-cyan)" },
  { max: 2099, label: "Contender", color: "var(--tier-blue)" },
  { max: 2299, label: "Expert", color: "var(--tier-violet)" },
  { max: 2499, label: "Elite", color: "var(--tier-orange)" },
  { max: Infinity, label: "Grandmaster", color: "var(--tier-red)" },
];

function getTier(platform, rating) {
  if (!rating || rating <= 0) {
    return { label: "Unrated", color: "var(--tier-gray)" };
  }
  const table = platform === "leetcode" ? LEETCODE_TIERS : CF_TIERS;
  return table.find((t) => rating <= t.max) || table[table.length - 1];
}

module.exports = { getTier };
