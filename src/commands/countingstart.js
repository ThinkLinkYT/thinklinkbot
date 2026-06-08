const { SlashCommandBuilder } = require("discord.js");
const { countingSessions, saveSessions } = require("../utils/counting");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("countingstart")
    .setDescription("Start a counting game in this channel"),

  async execute(i) {
    countingSessions.set(i.channelId, {
      currentNumber: 1,
      lastUserId: null,
      lives: 3
    });

    saveSessions();

    await i.reply(
      "Counting game started! Begin with **1**. You have 3 chances."
    );
  }
};
