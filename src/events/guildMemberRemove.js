const { sendMemberEmbed } = require("../utils/audit");

const WELCOME_CHANNEL_ID = "1265100685591052288";

module.exports = {
  name: "guildMemberRemove",
  async execute(member, client) {
    const avatar = member.user.displayAvatarURL({ size: 256 });
    const guildIcon = member.guild.iconURL({ size: 128 });
    const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
    const joinedTimestamp = member.joinedTimestamp
      ? Math.floor(member.joinedTimestamp / 1000)
      : null;

    await sendMemberEmbed(
      client,
      WELCOME_CHANNEL_ID,
      "Member Left",
      `**${member.user.tag}** left **${member.guild.name}**.\n\n` +
        `The server now has **${Number(member.guild.memberCount || 0).toLocaleString()}** members.`,
      0xed4245,
      null,
      {
        author: {
          name: member.user.tag,
          iconURL: avatar
        },
        thumbnail: avatar,
        footer: {
          text: `${member.guild.name} • Until next time`,
          iconURL: guildIcon || undefined
        },
        fields: [
          {
            name: "User",
            value: `<@${member.id}>`,
            inline: true
          },
          {
            name: "Account Created",
            value: `<t:${createdTimestamp}:R>`,
            inline: true
          },
          {
            name: "Joined Server",
            value: joinedTimestamp ? `<t:${joinedTimestamp}:R>` : "Unknown",
            inline: false
          }
        ]
      }
    );
  }
};
