const { loadMapFromFile, saveMapToFile } = require("./persistence");

const DEFAULT_COUNTING_CHANNEL_ID = "1400925112592633886";
const DEFAULT_SESSION = Object.freeze({
  enabled: true,
  currentNumber: 1,
  lastUserId: null,
  lives: 3
});

const countingSessions = new Map();
const countingLeaderboard = new Map();

function getCountingChannelId() {
  return process.env.COUNTING_CHANNEL_ID || DEFAULT_COUNTING_CHANNEL_ID;
}

function normalizePositiveInteger(value, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

function normalizeSession(session = {}) {
  return {
    enabled: session.enabled !== false,
    currentNumber: normalizePositiveInteger(
      session.currentNumber,
      DEFAULT_SESSION.currentNumber
    ),
    lastUserId:
      typeof session.lastUserId === "string" && session.lastUserId.trim()
        ? session.lastUserId
        : null,
    lives: normalizePositiveInteger(session.lives, DEFAULT_SESSION.lives)
  };
}

function normalizeLeaderboardScore(score) {
  const number = Number.parseInt(score, 10);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

function createSession() {
  return { ...DEFAULT_SESSION };
}

function saveCountingMap(file, map, transform = v => v) {
  try {
    saveMapToFile(file, map, transform);
    return true;
  } catch (err) {
    console.error(`Failed to save counting data to ${file}:`, err);
    return false;
  }
}

function loadLeaderboard() {
  loadMapFromFile("leaderboard.json", countingLeaderboard, normalizeLeaderboardScore);
}
function saveLeaderboard() {
  return saveCountingMap("leaderboard.json", countingLeaderboard, normalizeLeaderboardScore);
}

function loadSessions() {
  loadMapFromFile("sessions.json", countingSessions, normalizeSession);
}
function saveSessions() {
  return saveCountingMap("sessions.json", countingSessions, normalizeSession);
}

function ensureCountingSession(channelId, options = {}) {
  const { persist = true } = options;
  const existing = countingSessions.get(channelId);

  if (existing?.enabled === false) {
    return existing;
  }

  if (!existing) {
    const session = createSession();
    countingSessions.set(channelId, session);
    if (persist) saveSessions();
    return session;
  }

  const normalized = normalizeSession(existing);
  const changed =
    normalized.enabled !== existing.enabled ||
    normalized.currentNumber !== existing.currentNumber ||
    normalized.lastUserId !== existing.lastUserId ||
    normalized.lives !== existing.lives;

  if (changed) {
    countingSessions.set(channelId, normalized);
    if (persist) saveSessions();
    return normalized;
  }

  return existing;
}

function resetSession(channelId) {
  countingSessions.set(channelId, createSession());
  saveSessions();
}

function endSession(channelId) {
  countingSessions.set(channelId, {
    ...createSession(),
    enabled: false
  });
  return saveSessions();
}

function isSessionActive(session) {
  return Boolean(session && session.enabled !== false);
}

function chunkArray(arr, size) {
  return arr.reduce(
    (acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]),
    []
  );
}

module.exports = {
  DEFAULT_COUNTING_CHANNEL_ID,
  countingSessions,
  countingLeaderboard,
  getCountingChannelId,
  ensureCountingSession,
  endSession,
  isSessionActive,
  loadLeaderboard,
  saveLeaderboard,
  loadSessions,
  saveSessions,
  resetSession,
  chunkArray
};
