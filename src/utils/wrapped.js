const { loadMapFromFile, saveMapToFile } = require("./persistence");

const wrappedStats = new Map();
const wrappedHistory = new Map();
const vcJoins = new Map();
const HISTORY_FILE = "wrappedHistory.json";
const HISTORY_DAYS = 400;
const NUMBER_STATS = [
  "countingPoints",
  "tickets",
  "giveaways",
  "giveawaysWon",
  "magic8",
  "messages",
  "vcTime",
  "collabAccepted",
  "collabDenied",
  "modAccepted",
  "modDenied"
];
const MAP_STATS = ["topChannel", "topEmoji", "topMentions"];

function createEmptyStats() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    firstSeen: now.toISOString(),
    lastUpdated: now.toISOString(),
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

  for (const key of NUMBER_STATS) {
    const value = Number(normalized[key]);
    normalized[key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }

  normalized.year = new Date().getFullYear();
  normalized.lastUpdated = new Date().toISOString();

  return normalized;
}

function getUserStats(userId) {
  let stats = wrappedStats.get(userId);
  if (!stats) {
    stats = createEmptyStats();
    wrappedStats.set(userId, stats);
  } else {
    stats = normalizeStats(stats);
    wrappedStats.set(userId, stats);
  }
  return stats;
}

function loadWrappedStats() {
  loadMapFromFile("wrappedStats.json", wrappedStats, s => s);
  loadMapFromFile(HISTORY_FILE, wrappedHistory, history =>
    Array.isArray(history) ? history.filter(Boolean) : []
  );
}

function saveWrappedStats() {
  updateWrappedHistoryForAll();
  saveMapToFile("wrappedStats.json", wrappedStats, s => s);
  saveMapToFile(HISTORY_FILE, wrappedHistory, history => history);
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

function cloneStatMaps(stats) {
  const maps = {};
  for (const key of MAP_STATS) {
    maps[key] = { ...(stats[key] || {}) };
  }
  return maps;
}

function createStatsSnapshot(stats, at = Date.now()) {
  const normalized = normalizeStats({ ...stats, ...cloneStatMaps(stats) });
  const snapshot = {
    at,
    joined: normalized.joined,
    firstSeen: normalized.firstSeen
  };

  for (const key of NUMBER_STATS) {
    snapshot[key] = normalized[key] || 0;
  }

  for (const key of MAP_STATS) {
    snapshot[key] = { ...(normalized[key] || {}) };
  }

  return snapshot;
}

function getDayKey(timestamp = Date.now()) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function updateWrappedHistoryForUser(userId, stats = wrappedStats.get(userId)) {
  if (!stats) return;

  const now = Date.now();
  const today = getDayKey(now);
  const minAt = now - HISTORY_DAYS * 24 * 60 * 60 * 1000;
  const history = (wrappedHistory.get(userId) || [])
    .filter(entry => entry && Number(entry.at) >= minAt);
  const snapshot = createStatsSnapshot(stats, now);
  const existingIndex = history.findIndex(entry => getDayKey(Number(entry.at)) === today);

  if (existingIndex >= 0) history[existingIndex] = snapshot;
  else history.push(snapshot);

  history.sort((a, b) => Number(a.at) - Number(b.at));
  wrappedHistory.set(userId, history);
}

function updateWrappedHistoryForAll() {
  for (const [userId, stats] of wrappedStats.entries()) {
    updateWrappedHistoryForUser(userId, stats);
  }
}

function subtractNumber(current, previous) {
  return Math.max(0, (Number(current) || 0) - (Number(previous) || 0));
}

function subtractMap(current = {}, previous = {}) {
  const out = {};
  for (const [key, value] of Object.entries(current || {})) {
    const diff = subtractNumber(value, previous?.[key]);
    if (diff > 0) out[key] = diff;
  }
  return out;
}

function findBaseline(history, cutoff) {
  let baseline = null;
  for (const entry of history) {
    if (Number(entry.at) <= cutoff) baseline = entry;
    else break;
  }
  return baseline;
}

function buildRangeStats(userId, currentStats) {
  updateWrappedHistoryForUser(userId, currentStats);

  const now = Date.now();
  const current = createStatsSnapshot(currentStats, now);
  const history = wrappedHistory.get(userId) || [];
  const ranges = {
    all: {
      label: "All time",
      note: "Everything tracked for this user.",
      stats: current
    }
  };
  const rangeDefs = [
    ["7d", "Last 7 days", 7],
    ["30d", "Last 30 days", 30],
    ["90d", "Last 90 days", 90],
    ["365d", "Last 365 days", 365]
  ];

  for (const [key, label, days] of rangeDefs) {
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const baseline = findBaseline(history, cutoff);
    const ranged = {
      at: now,
      joined: current.joined,
      firstSeen: current.firstSeen
    };

    for (const statKey of NUMBER_STATS) {
      ranged[statKey] = baseline
        ? subtractNumber(current[statKey], baseline[statKey])
        : current[statKey];
    }

    for (const mapKey of MAP_STATS) {
      ranged[mapKey] = baseline
        ? subtractMap(current[mapKey], baseline[mapKey])
        : { ...(current[mapKey] || {}) };
    }

    ranges[key] = {
      label,
      note: baseline
        ? `Activity since ${new Date(cutoff).toLocaleDateString("en-US")}.`
        : "Not enough older history yet, so this shows everything currently tracked.",
      stats: ranged
    };
  }

  return ranges;
}

module.exports = {
  wrappedStats,
  wrappedHistory,
  vcJoins,
  getUserStats,
  normalizeStats,
  loadWrappedStats,
  saveWrappedStats,
  formatVcTime,
  getTopEntries,
  buildRangeStats,
  updateWrappedHistoryForUser
};
