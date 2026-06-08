const { EmbedBuilder } = require("discord.js");
const { sendAuditLog } = require("../utils/audit");
const {
  truncate,
  getCachedMessageForAudit,
  buildMessageJumpUrl,
  buildAttachmentField,
  buildStickerField
} = require("../utils/messageAudit");

module.exports = {
  name: "messageDelete",
  async execute(msg) {
    if (!msg.guild) return;

    const cached = getCachedMessageForAudit(msg.client, msg.id);
    const author = msg.author || (cached?.authorId ? {
      id: cached.authorId,
      tag: cached.authorTag,
      bot: cached.authorBot,
      displayAvatarURL: () => cached.authorAvatar
    } : null);

    if (author?.bot) return;

    const avatar = author?.displayAvatarURL?.({ size: 128 }) || cached?.authorAvatar || null;
    const content = msg.content || cached?.content || "";
    const jumpUrl = buildMessageJumpUrl(
      msg.guild.id,
      msg.channelId || cached?.channelId,
      msg.id
    );
    const attachmentText = buildAttachmentField(cached, msg);
    const stickerText = buildStickerField(cached, msg);

    const embed = new EmbedBuilder()
      .setTitle("Message Deleted")
      .addFields(
        {
          name: "User",
          value: author?.id ? `<@${author.id}>` : cached?.authorTag || "Unknown",
          inline: true
        },
        { name: "Channel", value: `<#${msg.channelId || cached?.channelId}>`, inline: true },
        { name: "Message ID", value: msg.id, inline: true },
        {
          name: "Content",
          value: truncate(content)
        }
      )
      .setColor(0xff0000)
      .setTimestamp();

    if (avatar) embed.setAuthor({ name: author?.tag || cached?.authorTag || "Unknown User", iconURL: avatar });
    if (jumpUrl) embed.setURL(jumpUrl);
    if (attachmentText) embed.addFields({ name: "Attachments", value: attachmentText });
    if (stickerText) embed.addFields({ name: "Stickers", value: stickerText });
    if (cached?.createdTimestamp) {
      embed.addFields({
        name: "Sent",
        value: `<t:${Math.floor(cached.createdTimestamp / 1000)}:F>`,
        inline: false
      });
    }

    await sendAuditLog(msg.guild, embed);
  }
};
