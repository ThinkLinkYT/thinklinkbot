const MAX_MESSAGE_CACHE_SIZE = 5000;
const MESSAGE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function truncate(value, max = 1024) {
  const text = String(value || "").trim();
  if (!text) return "*No text content*";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 20)}... (${text.length} chars)`;
}

function getMessageAuditCache(client) {
  if (!client._messageAuditCache) client._messageAuditCache = new Map();
  return client._messageAuditCache;
}

function pruneMessageAuditCache(client, now = Date.now()) {
  const cache = getMessageAuditCache(client);

  for (const [messageId, snapshot] of cache.entries()) {
    if (now - snapshot.cachedAt > MESSAGE_CACHE_TTL_MS) {
      cache.delete(messageId);
    }
  }

  while (cache.size > MAX_MESSAGE_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

function getAttachmentLines(messageOrSnapshot) {
  const attachments = messageOrSnapshot.attachments;

  if (!attachments) return [];
  if (Array.isArray(attachments)) {
    return attachments.map(att => att.name ? `[${att.name}](${att.url})` : att.url);
  }

  return [...attachments.values()].map(att =>
    att.name ? `[${att.name}](${att.url})` : att.url
  );
}

function getStickerLines(messageOrSnapshot) {
  const stickers = messageOrSnapshot.stickers;

  if (!stickers) return [];
  if (Array.isArray(stickers)) {
    return stickers.map(sticker => sticker.name || sticker.id);
  }

  return [...stickers.values()].map(sticker => sticker.name || sticker.id);
}

function snapshotMessage(message) {
  return {
    id: message.id,
    guildId: message.guildId || message.guild?.id || null,
    channelId: message.channelId || message.channel?.id || null,
    authorId: message.author?.id || null,
    authorTag: message.author?.tag || "Unknown User",
    authorBot: Boolean(message.author?.bot),
    authorAvatar: message.author?.displayAvatarURL?.({ size: 128 }) || null,
    content: message.content || "",
    attachments: getAttachmentLines(message).map(line => {
      const match = line.match(/^\[(.+)]\((.+)\)$/);
      return match ? { name: match[1], url: match[2] } : { name: null, url: line };
    }),
    stickers: getStickerLines(message).map(name => ({ name })),
    embedCount: message.embeds?.length || 0,
    createdTimestamp: message.createdTimestamp || Date.now(),
    cachedAt: Date.now()
  };
}

function cacheMessageForAudit(message) {
  if (!message.guild || !message.id) return;
  const cache = getMessageAuditCache(message.client);
  cache.set(message.id, snapshotMessage(message));
  pruneMessageAuditCache(message.client);
}

function getCachedMessageForAudit(client, messageId) {
  return getMessageAuditCache(client).get(messageId) || null;
}

function buildMessageJumpUrl(guildId, channelId, messageId) {
  if (!guildId || !channelId || !messageId) return null;
  return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}

function buildAttachmentField(snapshot, liveMessage = null) {
  const lines = [
    ...getAttachmentLines(liveMessage || {}),
    ...getAttachmentLines(snapshot || {})
  ];
  const unique = [...new Set(lines)].filter(Boolean);
  if (!unique.length) return null;
  return truncate(unique.join("\n"), 1024);
}

function buildStickerField(snapshot, liveMessage = null) {
  const lines = [
    ...getStickerLines(liveMessage || {}),
    ...getStickerLines(snapshot || {})
  ];
  const unique = [...new Set(lines)].filter(Boolean);
  if (!unique.length) return null;
  return truncate(unique.join(", "), 1024);
}

module.exports = {
  truncate,
  cacheMessageForAudit,
  getCachedMessageForAudit,
  buildMessageJumpUrl,
  buildAttachmentField,
  buildStickerField
};
