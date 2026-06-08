const { EmbedBuilder } = require("discord.js");

const AUDIT_LOG_CHANNEL_ID = "1455028878576849059";

function sendAuditLog(guild, embed) {
  if (!guild) return;
  const channel = guild.channels.cache.get(AUDIT_LOG_CHANNEL_ID);
  if (!channel) return;
  channel.send({ embeds: [embed] }).catch(() => {});
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
