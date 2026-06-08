const { EmbedBuilder } = require("discord.js");
const { sendAuditLog } = require("../utils/audit");

module.exports = {
  name: "messageDelete",
  execute(msg) {
    if (!msg.guild || !msg.author || msg.author.bot) return;

    const avatar = msg.author.displayAvatarURL({ size: 128 });
    const embed = new EmbedBuilder()
      .setAuthor({ name: msg.author.tag, iconURL: avatar })
      .setTitle("🗑️ Message Deleted")
      .addFields(
        { name: "User", value: `<@${msg.author.id}>`, inline: true },
        { name: "Channel", value: `<#${msg.channel.id}>`, inline: true },
        {
          name: "Content",
          value: msg.content?.slice(0, 1024) || "*No content / embed only*"
        }
      )
      .setColor(0xff0000)
      .setTimestamp();

    sendAuditLog(msg.guild, embed);
  }
};
