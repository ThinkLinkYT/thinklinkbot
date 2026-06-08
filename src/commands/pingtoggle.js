const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pingtoggle")
    .setDescription("Toggle whether people can ping you"),

  async execute(interaction) {
    const { getPingSettings, savePingSettings } = require("../utils/pingManager");

    const userId = interaction.user.id;
    const settings = getPingSettings();

    // First toggle → turn OFF pings
    if (settings[userId] === undefined) {
      settings[userId] = false;
    } else {
      settings[userId] = !settings[userId];
    }

    savePingSettings(settings);

    const newState = settings[userId];

    await interaction.reply({
      content: newState
        ? "🔔 You **will now receive pings** from other users."
        : "🔕 You **will no longer receive pings**. Messages pinging you will be deleted.",
      ephemeral: true
    });
  }
};
