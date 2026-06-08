const { EmbedBuilder } = require("discord.js");
const { sendAuditLog } = require("../utils/audit");

module.exports = {
  name: "guildBanRemove",

  execute(ban) {
    const user = ban.user;
    const guild = ban.guild;

    if (!guild || !user) return;

    const avatar = user.displayAvatarURL({ size: 128 });

    const embed = new EmbedBuilder()
      .setAuthor({ name: user.tag, iconURL: avatar })
      .setTitle("⚖️ User Unbanned")
      .setDescription(`User: <@${user.id}>`)
      .setColor(0x27ae60)
      .setTimestamp();

    sendAuditLog(guild, embed);
  }
};
