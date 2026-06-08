const fs = require("fs");
const path = require("path");

function cloneFallback(fallback) {
  if (fallback === null || fallback === undefined) return fallback;
  return JSON.parse(JSON.stringify(fallback));
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJSON(filePath, fallback = {}, options = {}) {
  const { createIfMissing = true, space = 2 } = options;

  if (!fs.existsSync(filePath)) {
    const value = cloneFallback(fallback);
    if (createIfMissing) writeJSONAtomic(filePath, value, space);
    return value;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) return cloneFallback(fallback);
    return JSON.parse(raw);
  } catch (err) {
    const backupPath = `${filePath}.corrupt-${Date.now()}`;
    try {
      fs.copyFileSync(filePath, backupPath);
      console.error(`Invalid JSON in ${filePath}. Backup written to ${backupPath}.`);
    } catch (backupErr) {
      console.error(`Invalid JSON in ${filePath}, and backup failed:`, backupErr);
    }
    console.error(err);
    return cloneFallback(fallback);
  }
}

function writeJSONAtomic(filePath, data, space = 2) {
  ensureParentDir(filePath);
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(data, null, space)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

module.exports = {
  readJSON,
  writeJSONAtomic
};
