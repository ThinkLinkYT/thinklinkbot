const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription("Post the ticket support panel"),

  async execute(i) {
    const embed = new EmbedBuilder()
      .setTitle("Support Panel")
      .setDescription(
        "Here is your support panel for **ThinkLink's Land!**\n\n" +
        "Click **General Ticket** for general inquiries,\n" +
        "**Collab Requests** for collaboration requests,\n" +
        "or **Applications** to apply for available positions."
      )
      .setColor(0x2f3136);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("general_ticket")
        .setLabel("General Ticket")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("collab_ticket")
        .setLabel("Collab Requests")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("applications_ticket")
        .setLabel("Applications")
        .setStyle(ButtonStyle.Success)
    );

    await i.reply({ embeds: [embed], components: [row] });
  }
};
