const { SlashCommandBuilder } = require("discord.js");
const { isTicketChannel } = require("../utils/tickets");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("closeticket")
    .setDescription("Delete the current ticket channel"),

  async execute(i) {
    if (!isTicketChannel(i.channel)) {
      return i.reply({
        content: "This command must be used inside a ticket channel.",
        ephemeral: true
      });
    }

    await i.reply({ content: "Deleting ticket channel..." });

    try {
      await i.channel.delete();
    } catch (err) {
      console.error(err);
      await i.followUp({ content: "Failed to delete ticket." });
    }
  }
};
