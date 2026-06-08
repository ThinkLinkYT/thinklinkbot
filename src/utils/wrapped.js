const { loadMapFromFile, saveMapToFile } = require("./persistence");

const wrappedStats = new Map();
const vcJoins = new Map();

function createEmptyStats() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    countingPoints: 0,
    tickets: 0,
    giveaways: 0,
    giveawaysWon: 0,
    magic8: 0,
    messages: 0,
    vcTime: 0,
    collabAccepted: 0,
    collabDenied: 0,
    modAccepted: 0,
    modDenied: 0,
    joined: now.toISOString(),
    topChannel: {},
    topEmoji: {},
    topMentions: {}
  };
}

function normalizeStats(stats) {
  const base = createEmptyStats();
  const normalized = stats && typeof stats === "object" ? stats : {};

  for (const [key, value] of Object.entries(base)) {
    if (normalized[key] === undefined || normalized[key] === null) {
      normalized[key] = value;
    }
  }

  if (typeof normalized.topChannel !== "object" || Array.isArray(normalized.topChannel)) {
    normalized.topChannel = {};
  }
  if (typeof normalized.topEmoji !== "object" || Array.isArray(normalized.topEmoji)) {
    normalized.topEmoji = {};
  }
  if (typeof normalized.topMentions !== "object" || Array.isArray(normalized.topMentions)) {
    normalized.topMentions = {};
  }

  return normalized;
}

function getUserStats(userId) {
  const currentYear = new Date().getFullYear();
  let stats = wrappedStats.get(userId);
  if (!stats) {
    stats = createEmptyStats();
    wrappedStats.set(userId, stats);
  } else if (stats.year !== currentYear) {
    const preservedJoined = stats.joined || new Date().toISOString();
    stats = createEmptyStats();
    stats.joined = preservedJoined;
    stats.year = currentYear;
    wrappedStats.set(userId, stats);
  } else {
    stats = normalizeStats(stats);
    wrappedStats.set(userId, stats);
  }
  return stats;
}

function loadWrappedStats() {
  loadMapFromFile("wrappedStats.json", wrappedStats, s => s);
}
function saveWrappedStats() {
  saveMapToFile("wrappedStats.json", wrappedStats, s => s);
}

function formatVcTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(" ");
}

function getTopEntries(obj, limit = 3) {
  const entries = Object.entries(obj || {});
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, limit);
}

module.exports = {
  wrappedStats,
  vcJoins,
  getUserStats,
  normalizeStats,
  loadWrappedStats,
  saveWrappedStats,
  formatVcTime,
  getTopEntries
};
