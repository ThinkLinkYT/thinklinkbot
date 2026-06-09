const {
  countingSessions,
  countingLeaderboard,
  ensureCountingSession,
  getCountingChannelId,
  isSessionActive,
  saveSessions,
  saveLeaderboard,
  resetSession
} = require("../utils/counting");
const { cacheMessageForAudit } = require("../utils/messageAudit");
const crypto = require("crypto");

const DUPLICATE_WINDOW_MS = 10 * 1000;
const DUPLICATE_CHANNEL_THRESHOLD = 4;
const BURST_WINDOW_MS = 10 * 1000;
const BURST_CHANNEL_THRESHOLD = 4;
const BURST_MESSAGE_THRESHOLD = 5;
const MULTI_CHANNEL_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const MIN_SIGNATURE_LENGTH = 8;

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
    if (msg.author.bot || !msg.guild) return;

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
    const pruneWindow = Math.max(DUPLICATE_WINDOW_MS, BURST_WINDOW_MS);
    const nowForPrune = Date.now();

    if (!msg.client._lastProtectionPrune || nowForPrune - msg.client._lastProtectionPrune > 60000) {
      pruneActivityMap(msgCache, pruneWindow, nowForPrune);
      pruneActivityMap(userCache, pruneWindow, nowForPrune);
      msg.client._lastProtectionPrune = nowForPrune;
    }

    // Wait briefly so Discord can attach embeds (important for forwarded messages)
    await new Promise(res => setTimeout(res, 150));
    cacheMessageForAudit(msg);

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

    if (signature.length >= MIN_SIGNATURE_LENGTH) {
      const hash = crypto
        .createHash("sha256")
        .update(`${msg.author.id}:${signature}`)
        .digest("hex");

      if (!msgCache.has(hash)) msgCache.set(hash, []);

      msgCache.get(hash).push({
        userId: msg.author.id,
        channelId: msg.channel.id,
        messageId: msg.id,
        timestamp: Date.now()
      });

      const now = Date.now();

      const filtered = msgCache.get(hash).filter(e => now - e.timestamp <= DUPLICATE_WINDOW_MS);
      msgCache.set(hash, filtered);

      const uniqueChannels = new Set(filtered.map(e => e.channelId));

      if (uniqueChannels.size >= DUPLICATE_CHANNEL_THRESHOLD) {
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
          if (member) await member.timeout(MULTI_CHANNEL_TIMEOUT_MS, "Multi-channel hacked-account blast detected");
        } catch (err) {
          console.error("Failed to timeout user:", err);
        }

        console.log(`Multi-channel duplicate blast detected for user ${msg.author.id}.`);
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
    const recent = userCache.get(userId).filter(e => now - e.timestamp <= BURST_WINDOW_MS);
    userCache.set(userId, recent);

    // Count unique channels
    const userChannels = new Set(recent.map(e => e.channelId));

    if (
      userChannels.size >= BURST_CHANNEL_THRESHOLD &&
      recent.length >= BURST_MESSAGE_THRESHOLD
    ) {
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
        if (member) await member.timeout(MULTI_CHANNEL_TIMEOUT_MS, "Multi-channel hacked-account burst detected");
      } catch (err) {
        console.error("Failed to timeout user:", err);
      }

      console.log(`Multi-channel burst detected for user ${userId}.`);
      userCache.delete(userId);
      return;
    }

    // ============================================================
    // END HACK PROTECTION
    // ============================================================


    const countingChannelId = getCountingChannelId();

    // Enforce numeric-only in counting channel
    if (
      msg.channelId === countingChannelId &&
      !/^[-+]?\d+$/.test(msg.content.trim())
    ) {
      try {
        await msg.delete();
      } catch (err) {
        console.error("Failed to delete non-numeric:", err);
      }
      return;
    }

    const session =
      msg.channelId === countingChannelId
        ? ensureCountingSession(msg.channelId)
        : countingSessions.get(msg.channelId);
    if (!isSessionActive(session)) return;

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

      saveLeaderboard();
      saveSessions();
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
