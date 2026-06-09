const fs = require("fs");
const path = require("path");

const STALE_TEMP_FILE_MS = 30 * 1000;
const TEMP_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const lastTempCleanupByFile = new Map();

function cloneFallback(fallback) {
  if (fallback === null || fallback === undefined) return fallback;
  return JSON.parse(JSON.stringify(fallback));
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function cleanupTempFile(tempPath) {
  try {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  } catch (err) {
    console.error(`Failed to remove temp JSON file ${tempPath}:`, err);
  }
}

function cleanupStaleTempFiles(filePath) {
  const now = Date.now();
  const lastCleanup = lastTempCleanupByFile.get(filePath) || 0;
  if (now - lastCleanup < TEMP_CLEANUP_INTERVAL_MS) return;
  lastTempCleanupByFile.set(filePath, now);

  const dir = path.dirname(filePath);
  const prefix = `${path.basename(filePath)}.`;

  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`Failed to scan JSON temp files for ${filePath}:`, err);
    }
    return;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.startsWith(prefix) || !entry.name.endsWith(".tmp")) {
      continue;
    }

    const tempPath = path.join(dir, entry.name);
    try {
      const stats = fs.statSync(tempPath);
      if (now - stats.mtimeMs >= STALE_TEMP_FILE_MS) cleanupTempFile(tempPath);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error(`Failed to inspect JSON temp file ${tempPath}:`, err);
      }
    }
  }
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
  cleanupStaleTempFiles(filePath);
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tempPath, `${JSON.stringify(data, null, space)}\n`, "utf8");
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    cleanupTempFile(tempPath);
    throw err;
  }
}

module.exports = {
  readJSON,
  writeJSONAtomic
};
