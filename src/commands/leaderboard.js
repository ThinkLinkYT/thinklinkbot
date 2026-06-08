const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { countingLeaderboard, chunkArray } = require("../utils/counting");
const { loadUsers, normalizeUser } = require("../utils/database");

function getLeaderboardValue(user, type) {
  const u = normalizeUser(user);
  if (type === "money") return u.wallet + u.bank;
  if (type === "fish") return u.stats.fishCaught;
  if (type === "quests") return u.stats.questsCompleted;
  if (type === "mining") return u.stats.oresMined;
  if (type === "woodcutting") return u.stats.woodChopped;
  if (type === "farming") return u.stats.farming || 0;
  return 0;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View a leaderboard")
    .addStringOption(option =>
      option
        .setName("type")
        .setDescription("Leaderboard type")
        .setRequired(true)
        .addChoices(
          { name: "Counting", value: "counting" },
          { name: "Money", value: "money" },
          { name: "Fish Caught", value: "fish" },
          { name: "Quests Completed", value: "quests" },
          { name: "Ores Mined", value: "mining" },
          { name: "Wood Chopped", value: "woodcutting" },
          { name: "Crops Farmed", value: "farming" }
        )
    ),

  async execute(i) {
    const type = i.options.getString("type");
    let sorted = [];

    // COUNTING LEADERBOARD
    if (type === "counting") {
      sorted = [...countingLeaderboard.entries()].sort((a, b) => b[1] - a[1]);
    }

    // ECONOMY LEADERBOARDS
    else {
      const users = loadUsers();

      for (const userId in users) {
        sorted.push([userId, getLeaderboardValue(users[userId], type)]);
      }

      sorted.sort((a, b) => b[1] - a[1]);
    }

    if (!sorted.length) {
      return i.reply("No data available for this leaderboard.");
    }

    const pages = chunkArray(sorted, 5);
    const pageIndex = 0;

    const lines = pages[pageIndex].map(([userId, score], idx) =>
      `**${idx + 1}.** <@${userId}> — ${score}`
    );

    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${type.charAt(0).toUpperCase() + type.slice(1)} Leaderboard`)
      .setDescription(lines.join("\n"))
      .setFooter({ text: `Page ${pageIndex + 1} of ${pages.length}` })
      .setColor(0xffd700);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`leaderboard_prev_${type}_${pageIndex}`)
        .setLabel("Back")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId(`leaderboard_next_${type}_${pageIndex}`)
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pages.length === 1)
    );

    await i.reply({ embeds: [embed], components: [row] });
  }
};
