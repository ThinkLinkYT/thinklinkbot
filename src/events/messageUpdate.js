const { EmbedBuilder } = require("discord.js");
const { sendAuditLog } = require("../utils/audit");

module.exports = {
  name: "messageUpdate",
  execute(oldMsg, newMsg) {
    if (!newMsg.guild || !newMsg.author || newMsg.author.bot) return;
    if (oldMsg.content === newMsg.content) return;

    const avatar = newMsg.author.displayAvatarURL({ size: 128 });
    const embed = new EmbedBuilder()
      .setAuthor({ name: newMsg.author.tag, iconURL: avatar })
      .setTitle("✏️ Message Edited")
      .addFields(
        { name: "User", value: `<@${newMsg.author.id}>`, inline: true },
        { name: "Channel", value: `<#${newMsg.channel.id}>`, inline: true },
        { name: "Before", value: (oldMsg.content || "*None*").slice(0, 1024) },
        { name: "After", value: (newMsg.content || "*None*").slice(0, 1024) }
      )
      .setColor(0xf1c40f)
      .setTimestamp();

    sendAuditLog(newMsg.guild, embed);
  }
};
