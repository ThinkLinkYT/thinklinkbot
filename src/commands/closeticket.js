const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("closeticket")
    .setDescription("Delete the current ticket thread"),

  async execute(i) {
    if (!i.channel.isThread()) {
      return i.reply({
        content: "This command must be used inside a ticket thread.",
        ephemeral: true
      });
    }

    await i.reply({ content: "Deleting ticket..." });

    try {
      await i.channel.delete();
    } catch (err) {
      console.error(err);
      await i.followUp({ content: "Failed to delete ticket." });
    }
  }
};
