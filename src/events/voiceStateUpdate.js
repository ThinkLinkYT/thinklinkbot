const { vcJoins, getUserStats, saveWrappedStats } = require("../utils/wrapped");

module.exports = {
  name: "voiceStateUpdate",
  execute(oldState, newState) {
    const userId = newState.id;
    const oldChannel = oldState.channelId;
    const newChannel = newState.channelId;

    // Join
    if (!oldChannel && newChannel) {
      vcJoins.set(userId, Date.now());
    }

    // Leave
    if (oldChannel && !newChannel) {
      const joinedAt = vcJoins.get(userId);
      if (joinedAt) {
        const diff = Date.now() - joinedAt;
        const stats = getUserStats(userId);
        stats.vcTime = (stats.vcTime || 0) + diff;
        saveWrappedStats();
        vcJoins.delete(userId);
      }
    }

    // Switch channel
    if (oldChannel && newChannel && oldChannel !== newChannel) {
      const joinedAt = vcJoins.get(userId);
      if (joinedAt) {
        const diff = Date.now() - joinedAt;
        const stats = getUserStats(userId);
        stats.vcTime = (stats.vcTime || 0) + diff;
        saveWrappedStats();
      }
      vcJoins.set(userId, Date.now());
    }
  }
};
