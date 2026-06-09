const { SlashCommandBuilder } = require("discord.js");
const { endSession } = require("../utils/counting");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("countingend")
    .setDescription("End the counting game in this channel"),

  async execute(i) {
    endSession(i.channelId);

    await i.reply("Counting game ended in this channel.");
  }
};
