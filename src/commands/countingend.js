const { SlashCommandBuilder } = require("discord.js");
const { countingSessions, saveSessions } = require("../utils/counting");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("countingend")
    .setDescription("End the counting game in this channel"),

  async execute(i) {
    countingSessions.delete(i.channelId);
    saveSessions();

    await i.reply("Counting game ended in this channel.");
  }
};
