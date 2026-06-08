const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { parseDurationMs } = require("../utils/parseDuration");
const {
  giveaways,
  saveGiveaways,
  scheduleGiveawayResolution
} = require("../utils/giveaways");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveawaycreate")
    .setDescription("Create a giveaway (Owner only)")
    .addStringOption(option =>
      option
        .setName("duration")
        .setDescription("Duration like 1h 30m 0s")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("prize")
        .setDescription("Prize description")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("winners")
        .setDescription("Number of winners")
        .setRequired(true)
    ),

  async execute(i, client) {
    await i.deferReply();

    const durationStr = i.options.getString("duration");
    const prize = i.options.getString("prize");
    const winnersCount = i.options.getInteger("winners");

    const totalMs = parseDurationMs(durationStr);
    if (!totalMs) {
      return i.editReply("Invalid duration. Use e.g. `1h 30m 0s`.");
    }

    if (winnersCount < 1) {
      return i.editReply("Winners must be at least 1.");
    }

    const endsAt = Date.now() + totalMs;
    const endTimestamp = Math.floor(endsAt / 1000);

    const embed = new EmbedBuilder()
      .setTitle("🎉 Giveaway")
      .setDescription(
        `**Prize:** ${prize}\n` +
        `**Winners:** ${winnersCount}\n` +
        `**Ends:** <t:${endTimestamp}:R>\n\n` +
        `Press the button below to enter!`
      )
      .setColor(0xf1c40f);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("giveaway_enter")
        .setLabel("Enter here")
        .setStyle(ButtonStyle.Success)
    );

    const msg = await i.editReply({ embeds: [embed], components: [row] });

    giveaways.set(msg.id, {
      channelId: i.channelId,
      endsAt,
      prize,
      winnersCount,
      entrants: new Set(),
      messageId: msg.id
    });

    saveGiveaways();
    scheduleGiveawayResolution(client, msg.id, giveaways.get(msg.id));
  }
};
