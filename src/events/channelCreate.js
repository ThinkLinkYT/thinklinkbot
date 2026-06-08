const { EmbedBuilder } = require("discord.js");
const { sendAuditLog } = require("../utils/audit");

module.exports = {
  name: "channelCreate",
  execute(ch) {
    if (!ch.guild) return;
    const embed = new EmbedBuilder()
      .setTitle("📁 Channel Created")
      .addFields(
        { name: "Name", value: `${ch.name}`, inline: true },
        { name: "ID", value: `${ch.id}`, inline: true },
        { name: "Type", value: `${ch.type}`, inline: true }
      )
      .setColor(0x2ecc71)
      .setTimestamp();

    sendAuditLog(ch.guild, embed);
  }
};
