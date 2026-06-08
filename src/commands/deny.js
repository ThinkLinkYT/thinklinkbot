const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUserStats, saveWrappedStats } = require("../utils/wrapped");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deny")
    .setDescription("Deny a collab request (Owner only)")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user to deny")
        .setRequired(true)
    ),

  async execute(i) {
    const user = i.options.getUser("user");
    if (!user) {
      return i.reply({
        content: "You must specify a user.",
        ephemeral: true
      });
    }

    const stats = getUserStats(user.id);
    stats.collabDenied = (stats.collabDenied || 0) + 1;
    saveWrappedStats();

    const embed = new EmbedBuilder()
      .setTitle("❌ Collab Request Denied")
      .setDescription(
        `<@${user.id}>, thank you for your interest. Unfortunately, your request has been denied.`
      )
      .setColor(0xE74C3C);

    await i.reply({ embeds: [embed] });
  }
};
