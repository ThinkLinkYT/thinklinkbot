const fs = require("fs");
const path = require("path");
const { readJSON, writeJSONAtomic } = require("./jsonStore");

function resolveDataPath(file) {
  return path.join(__dirname, "..", "..", "data", file);
}

function loadJSONSafe(file) {
  const full = resolveDataPath(file);
  if (!fs.existsSync(full)) return null;
  return readJSON(full, null, { createIfMissing: false });
}

function loadMapFromFile(file, map, transform = v => v) {
  const data = loadJSONSafe(file);
  map.clear();
  if (data) {
    for (const [k, v] of Object.entries(data)) {
      map.set(k, transform(v));
    }
  }
}

function saveMapToFile(file, map, transform = v => v) {
  const full = resolveDataPath(file);
  const obj = {};
  for (const [k, v] of map.entries()) {
    obj[k] = transform(v);
  }
  writeJSONAtomic(full, obj, 2);
}

module.exports = {
  loadJSONSafe,
  loadMapFromFile,
  saveMapToFile
};
