const fs = require("fs");
const path = require("path");
const { readJSON, writeJSONAtomic } = require("./jsonStore");

const settingsPath = path.join(__dirname, "../../data/pingSettings.json");
const abusePath = path.join(__dirname, "../../data/pingAbuse.json");

function loadJSON(file) {
  if (!fs.existsSync(file)) return {};
  return readJSON(file, {});
}

function saveJSON(file, data) {
  writeJSONAtomic(file, data, 2);
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
