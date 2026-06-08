const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const { parseDurationMs } = require("../utils/parseDuration");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeclose")
    .setDescription("Delete the current ticket thread after a given time")
    .addStringOption(option =>
      option
        .setName("time")
        .setDescription("Time format like 5h 10m 30s")
        .setRequired(true)
    ),

  async execute(i) {
    if (!i.channel.isThread()) {
      return i.reply({
        content: "This command must be used inside a ticket thread.",
        ephemeral: true
      });
    }

    const timeStr = i.options.getString("time");
    const totalMs = parseDurationMs(timeStr);

    if (!totalMs) {
      return i.reply({
        content: "Invalid time format. Use something like `5h 10m 30s`.",
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("Scheduled Ticket Deletion")
      .setDescription(`This ticket will be deleted in **${timeStr}**.`)
      .setColor(0xff0000);

    await i.reply({ embeds: [embed] });

    setTimeout(() => {
      i.channel.delete().catch(console.error);
    }, totalMs);
  }
};
