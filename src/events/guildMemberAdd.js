const { sendMemberEmbed } = require("../utils/audit");
const { applyUnderageTimeout } = require("../utils/underageTimeouts");

const WELCOME_CHANNEL_ID = "1265100685591052288";

function formatMemberNumber(count) {
  return `#${Number(count || 0).toLocaleString()}`;
}

module.exports = {
  name: "guildMemberAdd",
  async execute(member, client) {
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

    try {
      await applyUnderageTimeout(member);
    } catch (err) {
      console.error("Failed to apply auto-timeout:", err);
    }
  }
};
