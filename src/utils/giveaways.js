const { loadMapFromFile, saveMapToFile } = require("./persistence");
const { getUserStats, saveWrappedStats } = require("./wrapped");

const giveaways = new Map();
const MAX_TIMEOUT_MS = 2_147_483_647;

function pickWinners(arr, count) {
  const pool = [...arr];
  const winners = [];
  for (let i = 0; i < count && pool.length; i++) {
    winners.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return winners;
}

function scheduleGiveawayResolution(client, messageId, g) {
  const delay = Math.max(0, g.endsAt - Date.now());
  if (delay > MAX_TIMEOUT_MS) {
    setTimeout(() => scheduleGiveawayResolution(client, messageId, g), MAX_TIMEOUT_MS);
    return;
  }

  setTimeout(async () => {
    const giveaway = giveaways.get(messageId);
    if (!giveaway) return;

    const entrants = Array.from(giveaway.entrants);
    const winners = pickWinners(entrants, giveaway.winnersCount);

    for (const winnerId of winners) {
      const stats = getUserStats(winnerId);
      stats.giveawaysWon = (stats.giveawaysWon || 0) + 1;
    }
    saveWrappedStats();

    try {
      const channel = await client.channels.fetch(giveaway.channelId);
      const winnersMention = winners.length
        ? winners.map(id => `<@${id}>`).join(", ")
        : "No valid entrants.";
      const { EmbedBuilder } = require("discord.js");
      const resultEmbed = new EmbedBuilder()
        .setTitle("🎉 Giveaway Ended")
        .setDescription(
          `Prize: **${giveaway.prize}**\nWinners: ${winnersMention}\nTotal entrants: ${entrants.length}`
        )
        .setColor(0xF1C40F);
      await channel.send({
        content: winners.length ? winnersMention : undefined,
        embeds: [resultEmbed]
      });
    } catch (err) {
      console.error("Error announcing giveaway results:", err);
    }

    giveaways.delete(messageId);
    saveGiveaways();
  }, delay);
}

function loadGiveaways(client) {
  loadMapFromFile("giveaways.json", giveaways, g => {
    g.entrants = new Set(g.entrants || []);
    scheduleGiveawayResolution(client, g.messageId, g);
    return g;
  });
}

function saveGiveaways() {
  saveMapToFile("giveaways.json", giveaways, g => ({
    channelId: g.channelId,
    endsAt: g.endsAt,
    prize: g.prize,
    winnersCount: g.winnersCount,
    entrants: Array.from(g.entrants),
    messageId: g.messageId
  }));
}

module.exports = {
  giveaways,
  loadGiveaways,
  saveGiveaways,
  scheduleGiveawayResolution,
  pickWinners
};
