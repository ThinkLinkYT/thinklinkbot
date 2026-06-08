const { EmbedBuilder } = require("discord.js");
const { sendAuditLog } = require("../utils/audit");
const {
  truncate,
  cacheMessageForAudit,
  getCachedMessageForAudit,
  buildMessageJumpUrl,
  buildAttachmentField,
  buildStickerField
} = require("../utils/messageAudit");

module.exports = {
  name: "messageUpdate",
  async execute(oldMsg, newMsg) {
    if (!newMsg.guild || !newMsg.author || newMsg.author.bot) return;

    if (newMsg.partial) {
      newMsg = await newMsg.fetch().catch(() => newMsg);
    }

    const cached = getCachedMessageForAudit(newMsg.client, newMsg.id);
    const before = oldMsg.content || cached?.content || "";
    const after = newMsg.content || "";
    const attachmentText = buildAttachmentField(cached, newMsg);
    const stickerText = buildStickerField(cached, newMsg);

    if (before === after) {
      cacheMessageForAudit(newMsg);
      return;
    }

    const avatar = newMsg.author.displayAvatarURL({ size: 128 });
    const jumpUrl = buildMessageJumpUrl(newMsg.guild.id, newMsg.channel.id, newMsg.id);
    const embed = new EmbedBuilder()
      .setAuthor({ name: newMsg.author.tag, iconURL: avatar })
      .setTitle("Message Edited")
      .addFields(
        { name: "User", value: `<@${newMsg.author.id}>`, inline: true },
        { name: "Channel", value: `<#${newMsg.channel.id}>`, inline: true },
        { name: "Message ID", value: newMsg.id, inline: true },
        { name: "Before", value: truncate(before) },
        { name: "After", value: truncate(after) }
      )
      .setColor(0xf1c40f)
      .setTimestamp();

    if (jumpUrl) embed.setURL(jumpUrl);
    if (attachmentText) embed.addFields({ name: "Attachments", value: attachmentText });
    if (stickerText) embed.addFields({ name: "Stickers", value: stickerText });

    await sendAuditLog(newMsg.guild, embed);
    cacheMessageForAudit(newMsg);
  }
};
