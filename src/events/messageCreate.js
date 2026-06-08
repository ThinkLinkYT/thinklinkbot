const { countingSessions, countingLeaderboard, saveSessions, saveLeaderboard, resetSession } = require("../utils/counting");
const { getUserStats, saveWrappedStats } = require("../utils/wrapped");
const crypto = require("crypto");

function pruneActivityMap(map, windowMs, now) {
  for (const [key, entries] of map.entries()) {
    const recent = entries.filter(entry => now - entry.timestamp <= windowMs);
    if (recent.length) map.set(key, recent);
    else map.delete(key);
  }
}

module.exports = {
  name: "messageCreate",
  async execute(msg) {
    if (msg.author.bot) return;

    // ============================================================
    // 🔐 ANTI MULTI-CHANNEL HACK PROTECTION (USER + MESSAGE BASED)
    // ============================================================

    // Create caches if not exist
    if (!msg.client._duplicateMessageCache) {
      msg.client._duplicateMessageCache = new Map(); // message signature cache
    }
    if (!msg.client._userChannelActivity) {
      msg.client._userChannelActivity = new Map(); // user activity cache
    }

    const msgCache = msg.client._duplicateMessageCache;
    const userCache = msg.client._userChannelActivity;
    const WINDOW = 5000;
    const nowForPrune = Date.now();

    if (!msg.client._lastProtectionPrune || nowForPrune - msg.client._lastProtectionPrune > 60000) {
      pruneActivityMap(msgCache, WINDOW, nowForPrune);
      pruneActivityMap(userCache, WINDOW, nowForPrune);
      msg.client._lastProtectionPrune = nowForPrune;
    }

    // Wait briefly so Discord can attach embeds (important for forwarded messages)
    await new Promise(res => setTimeout(res, 150));

    // ---------------------------
    // 1. MESSAGE SIGNATURE CHECK
    // ---------------------------
    let signature = "";

    // Text
    if (msg.content && msg.content.trim().length > 0) {
      signature += msg.content.trim();
    }

    // Attachments
    if (msg.attachments.size > 0) {
      msg.attachments.forEach(att => {
        signature += att.url + (att.size || "");
      });
    }

    // Embeds (forwarded content, link previews)
    if (msg.embeds.length > 0) {
      msg.embeds.forEach(embed => {
        signature += JSON.stringify(embed.data || embed);
      });
    }

    if (signature.length > 0) {
      const hash = crypto.createHash("sha256").update(signature).digest("hex");

      if (!msgCache.has(hash)) msgCache.set(hash, []);

      msgCache.get(hash).push({
        channelId: msg.channel.id,
        messageId: msg.id,
        timestamp: Date.now()
      });

      const now = Date.now();

      const filtered = msgCache.get(hash).filter(e => now - e.timestamp <= WINDOW);
      msgCache.set(hash, filtered);

      const uniqueChannels = new Set(filtered.map(e => e.channelId));

      if (uniqueChannels.size >= 3) {
        // Delete all copies
        for (const entry of filtered) {
          try {
            const channel = await msg.client.channels.fetch(entry.channelId);
            const m = await channel.messages.fetch(entry.messageId);
            await m.delete().catch(() => {});
          } catch {}
        }

        // TIMEOUT USER FOR 1 DAY
        try {
          const member = await msg.guild?.members.fetch(msg.author.id);
          if (member) await member.timeout(24 * 60 * 60 * 1000, "Multi-channel hack behavior detected");
        } catch (err) {
          console.error("Failed to timeout user:", err);
        }

        console.log("🛑 Hack detected: identical message across channels.");
        msgCache.delete(hash);
        return;
      }
    }

    // ---------------------------
    // 2. USER MULTI-CHANNEL BURST CHECK
    // ---------------------------
    const userId = msg.author.id;

    if (!userCache.has(userId)) userCache.set(userId, []);

    userCache.get(userId).push({
      channelId: msg.channel.id,
      messageId: msg.id,
      timestamp: Date.now()
    });

    // Clean old entries
    const now = Date.now();
    const recent = userCache.get(userId).filter(e => now - e.timestamp <= WINDOW);
    userCache.set(userId, recent);

    // Count unique channels
    const userChannels = new Set(recent.map(e => e.channelId));

    if (userChannels.size >= 3) {
      // Delete all recent messages from this user across channels
      for (const entry of recent) {
        try {
          const channel = await msg.client.channels.fetch(entry.channelId);
          const m = await channel.messages.fetch(entry.messageId);
          await m.delete().catch(() => {});
        } catch {}
      }

      // TIMEOUT USER FOR 1 DAY
      try {
        const member = await msg.guild?.members.fetch(userId);
        if (member) await member.timeout(24 * 60 * 60 * 1000, "Multi-channel hack behavior detected");
      } catch (err) {
        console.error("Failed to timeout user:", err);
      }

      console.log(`🛑 Hack detected: user ${userId} posting in multiple channels.`);
      userCache.delete(userId);
      return;
    }

    // ============================================================
    // END HACK PROTECTION
    // ============================================================


    // Wrapped stats tracking
    const stats = getUserStats(msg.author.id);
    stats.messages = (stats.messages || 0) + 1;
    stats.topChannel[msg.channelId] = (stats.topChannel[msg.channelId] || 0) + 1;

    const emojiRegex = /<a?:\w+:\d+>/g;
    let match;
    while ((match = emojiRegex.exec(msg.content)) !== null) {
      const emojiStr = match[0];
      stats.topEmoji[emojiStr] = (stats.topEmoji[emojiStr] || 0) + 1;
    }

    msg.mentions.users.forEach(u => {
      stats.topMentions[u.id] = (stats.topMentions[u.id] || 0) + 1;
    });

    saveWrappedStats();

    // Enforce numeric-only in counting channel
    if (
      msg.channelId === "1400925112592633886" &&
      !/^[-+]?\d+$/.test(msg.content.trim())
    ) {
      try {
        await msg.delete();
      } catch (err) {
        console.error("Failed to delete non-numeric:", err);
      }
      return;
    }

    const session = countingSessions.get(msg.channelId);
    if (!session) return;

    const num = parseInt(msg.content.trim(), 10);
    if (isNaN(num)) return;

    const correct = num === session.currentNumber && msg.author.id !== session.lastUserId;
    if (correct) {
      await msg.react(num === 100 ? "💯" : "✅");
      session.currentNumber++;
      session.lastUserId = msg.author.id;

      countingLeaderboard.set(
        msg.author.id,
        (countingLeaderboard.get(msg.author.id) || 0) + 1
      );

      const cStats = getUserStats(msg.author.id);
      cStats.countingPoints = (cStats.countingPoints || 0) + 1;

      saveLeaderboard();
      saveSessions();
      saveWrappedStats();
    } else {
      await msg.react("❌");
      session.lives--;
      if (session.lives > 0) {
        const reason =
          num !== session.currentNumber
            ? `Expected **${session.currentNumber}**, got **${num}**.`
            : "Same user twice in a row not allowed.";
        await msg.channel.send(
          `Wrong! ${reason} You still have **${session.lives}** chance(s). Next number is **${session.currentNumber}**.`
        );
        saveSessions();
      } else {
        await msg.channel.send(
          "Out of chances! Resetting back to **1**. Lives restored to 3."
        );
        resetSession(msg.channelId);
      }
    }
  }
};
