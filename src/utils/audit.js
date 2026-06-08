const { EmbedBuilder } = require("discord.js");

const AUDIT_LOG_CHANNEL_ID = "1455028878576849059";

async function sendAuditLog(guild, embed) {
  if (!guild) return;
  try {
    const channel =
      guild.channels.cache.get(AUDIT_LOG_CHANNEL_ID) ||
      (await guild.channels.fetch(AUDIT_LOG_CHANNEL_ID).catch(() => null));

    if (!channel) {
      console.warn(`Audit log channel ${AUDIT_LOG_CHANNEL_ID} was not found.`);
      return;
    }

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error("Error sending audit log:", err);
  }
}

async function sendMemberEmbed(client, channelId, title, description, color, mention = null, options = {}) {
  try {
    const channel = await client.channels.fetch(channelId);
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();

    if (options.author) embed.setAuthor(options.author);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.footer) embed.setFooter(options.footer);
    if (options.fields?.length) embed.addFields(options.fields);

    await channel.send({
      content: mention || undefined,
      embeds: [embed],
      allowedMentions: mention ? { users: [mention.replace(/\D/g, "")] } : undefined
    });
  } catch (err) {
    console.error(`Error sending ${title}:`, err);
  }
}

module.exports = {
  AUDIT_LOG_CHANNEL_ID,
  sendAuditLog,
  sendMemberEmbed
};
