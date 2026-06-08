const { giveaways, saveGiveaways } = require("../utils/giveaways");
const { getUserStats, saveWrappedStats } = require("../utils/wrapped");

module.exports = {
  id: "giveaway_enter",
  async execute(i) {
    const g = giveaways.get(i.message.id);
    if (!g)
      return i.reply({ content: "This giveaway is no longer active.", ephemeral: true });
    if (Date.now() >= g.endsAt)
      return i.reply({ content: "Entries are closed.", ephemeral: true });

    const stats = getUserStats(i.user.id);
    stats.giveaways = (stats.giveaways || 0) + 1;
    saveWrappedStats();

    g.entrants.add(i.user.id);
    saveGiveaways();
    await i.reply({ content: "You're entered! 🎉", ephemeral: true });
  }
};
