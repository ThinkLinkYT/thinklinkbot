const { EmbedBuilder } = require("discord.js");
const { sendAuditLog } = require("../utils/audit");

module.exports = {
  name: "channelDelete",
  execute(ch) {
    if (!ch.guild) return;
    const embed = new EmbedBuilder()
      .setTitle("🗑️ Channel Deleted")
      .addFields(
        { name: "Name", value: `${ch.name}`, inline: true },
        { name: "ID", value: `${ch.id}`, inline: true },
        { name: "Type", value: `${ch.type}`, inline: true }
      )
      .setColor(0xe74c3c)
      .setTimestamp();

    sendAuditLog(ch.guild, embed);
  }
};
