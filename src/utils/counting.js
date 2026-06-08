const { loadMapFromFile, saveMapToFile } = require("./persistence");

const countingSessions = new Map();
const countingLeaderboard = new Map();

function loadLeaderboard() {
  loadMapFromFile("leaderboard.json", countingLeaderboard);
}
function saveLeaderboard() {
  saveMapToFile("leaderboard.json", countingLeaderboard);
}

function loadSessions() {
  loadMapFromFile("sessions.json", countingSessions);
}
function saveSessions() {
  saveMapToFile("sessions.json", countingSessions);
}

function resetSession(channelId) {
  countingSessions.set(channelId, { currentNumber: 1, lastUserId: null, lives: 3 });
  saveSessions();
}

function chunkArray(arr, size) {
  return arr.reduce(
    (acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]),
    []
  );
}

module.exports = {
  countingSessions,
  countingLeaderboard,
  loadLeaderboard,
  saveLeaderboard,
  loadSessions,
  saveSessions,
  resetSession,
  chunkArray
};
