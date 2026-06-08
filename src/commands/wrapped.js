const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const {
  getUserStats,
  formatVcTime,
  getTopEntries
} = require("../utils/wrapped");

function buildWrappedEmbed(stats, member, pageIndex) {
  const year = stats.year || new Date().getFullYear();
  const username = member?.displayName || member?.user?.username || "User";

  const joinedDate = stats.joined ? new Date(stats.joined) : null;
  const joinedTimestamp = joinedDate ? Math.floor(joinedDate.getTime() / 1000) : null;
  const now = new Date();
  const isAnniversary =
    joinedDate &&
    joinedDate.getDate() === now.getDate() &&
    joinedDate.getMonth() === now.getMonth();

  const base = new EmbedBuilder()
    .setAuthor({
      name: `${username}'s ${year} Wrapped`,
      iconURL: member?.displayAvatarURL?.() || undefined
    })
    .setColor([0x9b59b6, 0xe91e63, 0x5865f2, 0xf1c40f][pageIndex] || 0x5865f2)
    .setFooter({ text: `Page ${pageIndex + 1} of 4` });

  if (pageIndex === 0) {
    base.setTitle("🎧 Your Year at a Glance");
    base.setDescription(
      "Here’s your personal **ThinkLink's Land Wrapped** for this year.\n" +
        (isAnniversary ? "🎉 **Happy server anniversary!**\n\n" : "\n")
    );
    base.addFields(
      { name: "💬 Messages Sent", value: `${stats.messages || 0}`, inline: true },
      { name: "🔢 Counting Points", value: `${stats.countingPoints || 0}`, inline: true },
      { name: "🎫 Tickets Opened", value: `${stats.tickets || 0}`, inline: true },
      { name: "🎉 Giveaways Entered", value: `${stats.giveaways || 0}`, inline: true },
      { name: "🏆 Giveaways Won", value: `${stats.giveawaysWon || 0}`, inline: true },
      { name: "🎱 Magic 8-Ball Questions", value: `${stats.magic8 || 0}`, inline: true },
      { name: "🎙️ Time in Voice", value: formatVcTime(stats.vcTime || 0), inline: true },
      {
        name: "📅 Joined Server",
        value: joinedTimestamp ? `<t:${joinedTimestamp}:D>` : "Unknown",
        inline: true
      }
    );
    return base;
  }

  if (pageIndex === 1) {
    base.setTitle("📊 Activity Breakdown");
    base.setDescription("A closer look at how you show up around the server this year.");
    base.addFields(
      { name: "🤝 Collabs Accepted", value: `${stats.collabAccepted || 0}`, inline: true },
      { name: "🚫 Collabs Denied", value: `${stats.collabDenied || 0}`, inline: true },
      { name: "🛡️ Mod Apps Accepted", value: `${stats.modAccepted || 0}`, inline: true },
      { name: "📵 Mod Apps Denied", value: `${stats.modDenied || 0}`, inline: true },
      { name: "💬 Total Messages", value: `${stats.messages || 0}`, inline: true },
      { name: "🔢 Total Counting Points", value: `${stats.countingPoints || 0}`, inline: true }
    );
    return base;
  }

  if (pageIndex === 2) {
    base.setTitle("🏆 Your Top 3 Stats");

    const topChannels =
      getTopEntries(stats.topChannel, 3)
        .map(([id, count], idx) => `**${idx + 1}.** <#${id}> — ${count} messages`)
        .join("\n") || "No channel data yet.";

    const topEmojis =
      getTopEntries(stats.topEmoji, 3)
        .map(([emojiStr, count], idx) => `**${idx + 1}.** ${emojiStr} — ${count} uses`)
        .join("\n") || "No emoji data yet.";

    const topMentions =
      getTopEntries(stats.topMentions, 3)
        .map(([userId, count], idx) => `**${idx + 1}.** <@${userId}> — ${count} mentions`)
        .join("\n") || "No mention data yet.";

    base.addFields(
      { name: "📺 Top Channels", value: topChannels },
      { name: "😄 Top Emojis", value: topEmojis },
      { name: "📣 Top Mentions", value: topMentions }
    );

    base.setDescription("Your most iconic places, vibes, and people this year.");
    return base;
  }

  if (pageIndex === 3) {
    base.setTitle("🏅 Achievements");

    const achievements = [];

    if ((stats.messages || 0) >= 10000)
      achievements.push("**Message Machine** — 10,000+ messages.");
    if ((stats.messages || 0) >= 1000 && (stats.messages || 0) < 10000)
      achievements.push("**Chatty** — 1,000+ messages.");
    if ((stats.countingPoints || 0) >= 500)
      achievements.push("**Counting Legend** — 500+ correct counts.");
    if ((stats.tickets || 0) >= 20)
      achievements.push("**Ticket Enjoyer** — 20+ tickets opened.");
    if ((stats.giveaways || 0) >= 50)
      achievements.push("**Giveaway Goblin** — 50+ giveaway entries.");
    if ((stats.giveawaysWon || 0) >= 5)
      achievements.push("**Lucky Duck** — 5+ giveaway wins.");
    if ((stats.vcTime || 0) >= 24 * 3600000)
      achievements.push("**VC Warrior** — 24+ hours in voice.");
    if ((stats.collabAccepted || 0) >= 1)
      achievements.push("**Official Collaborator** — Collab accepted.");

    if (achievements.length === 0)
      achievements.push("No big achievements yet — but your story’s just getting started.");

    base.setDescription(achievements.map(a => `• ${a}`).join("\n"));
    return base;
  }

  return base.setDescription("Something went wrong building this page.");
}

function buildWrappedRow(pageIndex) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`wrapped_prev_${pageIndex}`)
      .setLabel("Back")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageIndex === 0),
    new ButtonBuilder()
      .setCustomId(`wrapped_next_${pageIndex}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(pageIndex === 3)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wrapped")
    .setDescription("View your Discord Wrapped for this year"),

  async execute(i) {
    const stats = getUserStats(i.user.id);
    const pageIndex = 0;

    const embed = buildWrappedEmbed(stats, i.member, pageIndex);
    const row = buildWrappedRow(pageIndex);

    await i.reply({ embeds: [embed], components: [row] });
  },

  buildWrappedEmbed,
  buildWrappedRow
};
