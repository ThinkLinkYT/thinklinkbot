const { PermissionFlagsBits } = require("discord.js");
const { MODERATOR_ROLE_ID } = require("./staff");

const LINK_WINDOW_MS = 30 * 1000;
const MENTION_WINDOW_MS = 20 * 1000;
const ATTACHMENT_WINDOW_MS = 30 * 1000;
const EVERYONE_WINDOW_MS = 60 * 1000;
const PRUNE_INTERVAL_MS = 60 * 1000;
const HACKED_ACCOUNT_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const EVERYONE_TIMEOUT_MS = 60 * 60 * 1000;

const LINK_SPAM_THRESHOLD = 3;
const LINK_CHANNEL_THRESHOLD = 2;
const INVITE_SPAM_THRESHOLD = 2;
const MENTION_MESSAGE_THRESHOLD = 2;
const MENTION_COUNT_THRESHOLD = 8;
const ROLE_MENTION_THRESHOLD = 4;
const ATTACHMENT_MESSAGE_THRESHOLD = 4;
const ATTACHMENT_COUNT_THRESHOLD = 6;
const EVERYONE_MESSAGE_THRESHOLD = 2;

const INVITE_REGEX = /\b(?:discord\.gg|discord(?:app)?\.com\/invite|discord\.com\/invite)\/[^\s<>()]+/i;
const URL_REGEX = /\b(?:https?:\/\/|www\.)[^\s<>()]+/i;
const SUSPICIOUS_DOMAINS = [
  "grabify.link",
  "iplogger.org",
  "iplogger.com",
  "2no.co",
  "yip.su",
  "blasze.com",
  "ps3cfw.com"
];
const SUSPICIOUS_PHRASES = [
  /free\s+nitro/i,
  /nitro\s+gift/i,
  /steam\s+gift/i,
  /airdrop/i,
  /verify\s+your\s+account/i,
  /scan\s+(?:this\s+)?qr/i
];

function getGuardState(client) {
  if (!client._hackedAccountGuard) {
    client._hackedAccountGuard = {
      links: new Map(),
      mentions: new Map(),
      attachments: new Map(),
      everyone: new Map(),
      lastPrune: 0
    };
  }

  return client._hackedAccountGuard;
}

function pruneMap(map, windowMs, now) {
  for (const [userId, entries] of map.entries()) {
    const recent = entries.filter(entry => now - entry.timestamp <= windowMs);
    if (recent.length) map.set(userId, recent);
    else map.delete(userId);
  }
}

function pruneState(state) {
  const now = Date.now();
  if (now - state.lastPrune < PRUNE_INTERVAL_MS) return;

  pruneMap(state.links, LINK_WINDOW_MS, now);
  pruneMap(state.mentions, MENTION_WINDOW_MS, now);
  pruneMap(state.attachments, ATTACHMENT_WINDOW_MS, now);
  pruneMap(state.everyone, EVERYONE_WINDOW_MS, now);
  state.lastPrune = now;
}

function addEntry(map, userId, entry, windowMs) {
  const now = Date.now();
  const entries = (map.get(userId) || []).filter(item => now - item.timestamp <= windowMs);
  entries.push(entry);
  map.set(userId, entries);
  return entries;
}

function getMessageText(message) {
  const parts = [message.content || ""];
  for (const embed of message.embeds || []) {
    parts.push(embed.url || "");
    parts.push(embed.title || "");
    parts.push(embed.description || "");
  }
  return parts.join(" ");
}

function containsSuspiciousDomain(text) {
  const lower = text.toLowerCase();
  return SUSPICIOUS_DOMAINS.some(domain => lower.includes(domain));
}

function containsSuspiciousPhrase(text) {
  return SUSPICIOUS_PHRASES.some(pattern => pattern.test(text));
}

function hasLink(text) {
  return URL_REGEX.test(text);
}

function canBypassSoftRules(message) {
  const member = message.member;
  if (!member) return false;
  if (process.env.OWNER_ID && message.author.id === process.env.OWNER_ID) return true;

  const roles = member.roles;
  const hasModRole = roles?.cache?.has
    ? roles.cache.has(MODERATOR_ROLE_ID)
    : Array.isArray(roles) && roles.includes(MODERATOR_ROLE_ID);

  return Boolean(
    hasModRole ||
      member.permissions?.has(PermissionFlagsBits.Administrator) ||
      member.permissions?.has(PermissionFlagsBits.ManageGuild) ||
      member.permissions?.has(PermissionFlagsBits.ManageMessages)
  );
}

function buildEntry(message, extra = {}) {
  return {
    channelId: message.channelId,
    messageId: message.id,
    timestamp: Date.now(),
    ...extra
  };
}

async function deleteTrackedMessages(client, entries) {
  for (const entry of entries) {
    try {
      const channel = await client.channels.fetch(entry.channelId);
      const message = await channel.messages.fetch(entry.messageId);
      await message.delete().catch(() => {});
    } catch {}
  }
}

async function timeoutMember(message, reason, durationMs = HACKED_ACCOUNT_TIMEOUT_MS) {
  try {
    const member = message.member || await message.guild.members.fetch(message.author.id);
    if (member?.moderatable) {
      await member.timeout(durationMs, reason);
      return true;
    }
  } catch (err) {
    console.error("Failed to timeout suspected hacked account:", err);
  }

  return false;
}

function uniqueChannelCount(entries) {
  return new Set(entries.map(entry => entry.channelId)).size;
}

async function handleDetection(message, reason, entries, options = {}) {
  await deleteTrackedMessages(message.client, entries);

  if (options.timeout !== false) {
    await timeoutMember(
      message,
      reason,
      options.timeoutMs || HACKED_ACCOUNT_TIMEOUT_MS
    );
  }

  console.log(`Hacked-account guard triggered for ${message.author.id}: ${reason}`);
  return true;
}

async function handleHackedAccountSpam(message) {
  if (!message.guild || message.author.bot) return false;
  if (process.env.OWNER_ID && message.author.id === process.env.OWNER_ID) return false;

  const state = getGuardState(message.client);
  pruneState(state);

  const text = getMessageText(message);
  const hasInvite = INVITE_REGEX.test(text);
  const hasAnyLink = hasInvite || hasLink(text);
  const suspiciousDomain = containsSuspiciousDomain(text);
  const suspiciousPhrase = containsSuspiciousPhrase(text);
  const mentionsEveryone = message.mentions.everyone || /@(?:everyone|here)\b/i.test(message.content || "");
  const mentionCount = message.mentions.users.size + message.mentions.roles.size;
  const roleMentionCount = message.mentions.roles.size;
  const attachmentCount = message.attachments.size;
  const canBypassSoft = canBypassSoftRules(message);
  const currentEntry = buildEntry(message);

  if (suspiciousDomain || (hasAnyLink && suspiciousPhrase)) {
    return handleDetection(
      message,
      "Suspicious hacked-account link detected",
      [currentEntry]
    );
  }

  if (hasAnyLink) {
    const entries = addEntry(
      state.links,
      message.author.id,
      buildEntry(message, { invite: hasInvite }),
      LINK_WINDOW_MS
    );
    const inviteEntries = entries.filter(entry => entry.invite);

    if (
      entries.length >= LINK_SPAM_THRESHOLD ||
      uniqueChannelCount(entries) >= LINK_CHANNEL_THRESHOLD ||
      inviteEntries.length >= INVITE_SPAM_THRESHOLD
    ) {
      return handleDetection(
        message,
        "Link or invite spam detected",
        entries
      );
    }

    if (hasInvite && !canBypassSoft) {
      return handleDetection(
        message,
        "Discord invite blocked",
        [currentEntry],
        { timeout: false }
      );
    }
  }

  if (mentionsEveryone) {
    const entries = addEntry(state.everyone, message.author.id, currentEntry, EVERYONE_WINDOW_MS);
    if (entries.length >= EVERYONE_MESSAGE_THRESHOLD) {
      return handleDetection(
        message,
        "Repeated everyone/here abuse detected",
        entries,
        { timeoutMs: EVERYONE_TIMEOUT_MS }
      );
    }

    if (!canBypassSoft) {
      return handleDetection(
        message,
        "Everyone/here mention blocked",
        [currentEntry],
        { timeout: false }
      );
    }
  }

  if (mentionCount > 0) {
    const entries = addEntry(
      state.mentions,
      message.author.id,
      buildEntry(message, { mentionCount, roleMentionCount }),
      MENTION_WINDOW_MS
    );
    const totalMentions = entries.reduce((sum, entry) => sum + entry.mentionCount, 0);
    const totalRoleMentions = entries.reduce((sum, entry) => sum + entry.roleMentionCount, 0);

    if (
      mentionCount >= MENTION_COUNT_THRESHOLD ||
      roleMentionCount >= ROLE_MENTION_THRESHOLD ||
      (entries.length >= MENTION_MESSAGE_THRESHOLD && totalMentions >= MENTION_COUNT_THRESHOLD) ||
      totalRoleMentions >= ROLE_MENTION_THRESHOLD
    ) {
      return handleDetection(
        message,
        "Mass mention spam detected",
        entries
      );
    }
  }

  if (attachmentCount > 0) {
    const entries = addEntry(
      state.attachments,
      message.author.id,
      buildEntry(message, { attachmentCount }),
      ATTACHMENT_WINDOW_MS
    );
    const totalAttachments = entries.reduce((sum, entry) => sum + entry.attachmentCount, 0);

    if (
      attachmentCount >= ATTACHMENT_COUNT_THRESHOLD ||
      entries.length >= ATTACHMENT_MESSAGE_THRESHOLD ||
      totalAttachments >= ATTACHMENT_COUNT_THRESHOLD
    ) {
      return handleDetection(
        message,
        "Attachment spam detected",
        entries
      );
    }
  }

  return false;
}

module.exports = {
  handleHackedAccountSpam
};
