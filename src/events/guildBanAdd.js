const { EmbedBuilder } = require("discord.js");
const { sendAuditLog } = require("../utils/audit");

module.exports = {
  name: "guildBanAdd",
  execute(ban) {
    const user = ban.user;
    const guild = ban.guild;
    const avatar = user.displayAvatarURL({ size: 128 });

    const embed = new EmbedBuilder()
      .setAuthor({ name: user.tag, iconURL: avatar })
      .setTitle("🔨 User Banned")
      .setDescription(`User: <@${user.id}>`)
      .setColor(0xc0392b)
      .setTimestamp();

    sendAuditLog(guild, embed);
  }
};
