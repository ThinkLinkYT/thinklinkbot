const { getUserStats, saveWrappedStats } = require("../utils/wrapped");
const { sendMemberEmbed, sendAuditLog } = require("../utils/audit");
const { EmbedBuilder } = require("discord.js");

const WELCOME_CHANNEL_ID = "1265100685591052288";

function formatMemberNumber(count) {
  return `#${Number(count || 0).toLocaleString()}`;
}

module.exports = {
  name: "guildMemberAdd",
  async execute(member, client) {
    const stats = getUserStats(member.id);
    if (!stats.joined) {
      stats.joined = new Date().toISOString();
      saveWrappedStats();
    }

    const avatar = member.user.displayAvatarURL({ size: 256 });
    const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
    const joinedTimestamp = Math.floor(Date.now() / 1000);
    const guildIcon = member.guild.iconURL({ size: 128 });

    await sendMemberEmbed(
      client,
      WELCOME_CHANNEL_ID,
      "Welcome to ThinkLink's Land",
      `${member} just joined **${member.guild.name}**.\n\n` +
        `You are member **${formatMemberNumber(member.guild.memberCount)}**. ` +
        "Make yourself at home, check the rules, and enjoy the server.",
      0x57f287,
      `<@${member.id}>`,
      {
        author: {
          name: member.user.tag,
          iconURL: avatar
        },
        thumbnail: avatar,
        footer: {
          text: `${member.guild.name} • Welcome aboard`,
          iconURL: guildIcon || undefined
        },
        fields: [
          {
            name: "Member",
            value: `${member}`,
            inline: true
          },
          {
            name: "Account Created",
            value: `<t:${createdTimestamp}:R>`,
            inline: true
          },
          {
            name: "Joined",
            value: `<t:${joinedTimestamp}:F>`,
            inline: false
          }
        ]
      }
    );

    // Auto-timeout for accounts < 7 days
    try {
      const accountAgeMs = Date.now() - member.user.createdTimestamp;
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      if (accountAgeMs < oneWeekMs) {
        const remainingMs = oneWeekMs - accountAgeMs;
        await member.timeout(
          remainingMs,
          "Account too new — auto timeout for safety"
        );

        const embed = new EmbedBuilder()
          .setAuthor({ name: `${member.user.tag}`, iconURL: avatar })
          .setTitle("⏳ Auto Timeout Applied")
          .setDescription(
            `User: <@${member.id}>\n` +
              `Account Age: **${Math.floor(
                accountAgeMs / (1000 * 60 * 60 * 24)
              )} days**\n` +
              `Timeout until account reaches 7 days old.`
          )
          .setColor(0xE67E22)
          .setTimestamp();

        sendAuditLog(member.guild, embed);
      }
    } catch (err) {
      console.error("Failed to apply auto-timeout:", err);
    }
  }
};
