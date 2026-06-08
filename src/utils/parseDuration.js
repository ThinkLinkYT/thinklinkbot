function parseDurationMs(str) {
  const units = { h: 3600000, m: 60000, s: 1000 };
  return str.split(/\s+/).reduce((ms, part) => {
    const [, num, unit] = part.match(/(\d+)([hms])/i) || [];
    return ms + (num ? parseInt(num) * units[unit.toLowerCase()] : 0);
  }, 0);
}

module.exports = { parseDurationMs };
