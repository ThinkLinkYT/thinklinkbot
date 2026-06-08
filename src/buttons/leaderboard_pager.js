const {
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

async function paginateLeaderboard(i, type, direction, current) {
  let sorted = [];

  if (type === "counting") {
    sorted = [...countingLeaderboard.entries()].sort((a, b) => b[1] - a[1]);
  } else {
    const users = loadUsers();

    for (const userId in users) {
      sorted.push([userId, getLeaderboardValue(users[userId], type)]);
    }

    sorted.sort((a, b) => b[1] - a[1]);
  }

  const pages = chunkArray(sorted, 5);
  let pageIndex = current;

  if (direction === "prev" && pageIndex > 0) pageIndex--;
  if (direction === "next" && pageIndex < pages.length - 1) pageIndex++;

  const lines = pages[pageIndex].map(
    ([userId, score], idx) =>
      `**${idx + 1 + pageIndex * 5}.** <@${userId}> — ${score}`
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
      .setDisabled(pageIndex === 0),

    new ButtonBuilder()
      .setCustomId(`leaderboard_next_${type}_${pageIndex}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(pageIndex === pages.length - 1)
  );

  await i.update({ embeds: [embed], components: [row] });
}

module.exports = {
  id: "leaderboard_pager",
  async execute(i, client) {
    if (!i.customId.startsWith("leaderboard_")) return;

    const [_, dir, type, idx] = i.customId.split("_");
    await paginateLeaderboard(i, type, dir, parseInt(idx));
  }
};
