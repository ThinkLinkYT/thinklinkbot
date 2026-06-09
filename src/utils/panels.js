const { EmbedBuilder, MessageFlags } = require("discord.js");

function inferPanelStyle(message) {
  const text = String(message || "").trim();
  const lower = text.toLowerCase();

  if (
    text.startsWith("✅") ||
    text.startsWith("🎉") ||
    text.startsWith("📦") ||
    text.startsWith("🐾") ||
    lower.includes("successful") ||
    lower.includes("success")
  ) {
    return { title: "Success", color: 0x57f287 };
  }

  if (
    text.startsWith("❌") ||
    text.startsWith("⚠️") ||
    lower.includes("not enough") ||
    lower.includes("invalid") ||
    lower.includes("cannot") ||
    lower.includes("failed") ||
    lower.includes("error")
  ) {
    return { title: "Action Needed", color: 0xed4245 };
  }

  if (
    text.startsWith("⏳") ||
    lower.includes("wait") ||
    lower.includes("cooldown")
  ) {
    return { title: "Please Wait", color: 0xfee75c };
  }

  return { title: "ThinkLinkBot", color: 0x5865f2 };
}

function createPanel(message, options = {}) {
  const { title, color } = inferPanelStyle(message);
  return new EmbedBuilder()
    .setTitle(options.title || title)
    .setDescription(String(message || "*No details provided.*").slice(0, 4096))
    .setColor(options.color ?? color)
    .setTimestamp();
}

function normalizeInteractionPayload(payload) {
  if (typeof payload === "string") {
    return { embeds: [createPanel(payload)] };
  }

  if (!payload || typeof payload !== "object") return payload;

  const hasText = typeof payload.content === "string" && payload.content.trim().length > 0;
  const hasEmbeds = Array.isArray(payload.embeds) && payload.embeds.length > 0;
  const nextPayload = { ...payload };

  if (typeof nextPayload.ephemeral === "boolean") {
    if (nextPayload.ephemeral) {
      nextPayload.flags = (nextPayload.flags || 0) | MessageFlags.Ephemeral;
    }
    delete nextPayload.ephemeral;
  }

  if (!hasText || hasEmbeds) return nextPayload;

  delete nextPayload.content;
  nextPayload.embeds = [createPanel(payload.content)];
  return nextPayload;
}

function installInteractionPanelReplies(interaction) {
  if (interaction._panelRepliesInstalled) return;
  interaction._panelRepliesInstalled = true;

  for (const methodName of ["reply", "deferReply", "editReply", "followUp", "update"]) {
    if (typeof interaction[methodName] !== "function") continue;
    const original = interaction[methodName].bind(interaction);
    interaction[methodName] = (payload, ...args) =>
      original(normalizeInteractionPayload(payload), ...args);
  }
}

module.exports = {
  createPanel,
  normalizeInteractionPayload,
  installInteractionPanelReplies
};
