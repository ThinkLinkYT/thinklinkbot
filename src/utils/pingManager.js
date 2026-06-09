const fs = require("fs");
const path = require("path");
const { readJSON, writeJSONAtomic } = require("./jsonStore");

const settingsPath = path.join(__dirname, "../../data/pingSettings.json");
const abusePath = path.join(__dirname, "../../data/pingAbuse.json");
const SAVE_FAILURE_PAUSE_MS = 5 * 60 * 1000;
let savesPausedUntil = 0;

function loadJSON(file) {
  if (!fs.existsSync(file)) return {};
  return readJSON(file, {});
}

function saveJSON(file, data) {
  if (Date.now() < savesPausedUntil) return false;

  try {
    writeJSONAtomic(file, data, 2);
    return true;
  } catch (err) {
    if (err?.code === "ENOSPC") {
      savesPausedUntil = Date.now() + SAVE_FAILURE_PAUSE_MS;
      console.error(
        "Ping data saves paused for 5 minutes because the host reported no writable disk space. " +
          "Free disk space or delete old data/*.tmp files in your host file manager."
      );
      return false;
    }

    console.error("Failed to save ping data:", err);
    return false;
  }
}

module.exports = {
  getPingSettings() {
    return loadJSON(settingsPath);
  },

  savePingSettings(data) {
    saveJSON(settingsPath, data);
  },

  getAbuseData() {
    return loadJSON(abusePath);
  },

  saveAbuseData(data) {
    saveJSON(abusePath, data);
  }
};
