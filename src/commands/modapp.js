const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const { getTicketOpenerMention, isTicketChannel } = require("../utils/tickets");

const modQuestions = [
  "What experience do you have in moderation on Discord?",
  "What makes you want to moderate this server?",
  "What makes you think you CAN moderate this server?",
  "What would you do in this scenario: Two mods are in an arguement and are breaking the rules?",
  "What would you do if somebody was bullying or harrassing another person in the server?",
  "Do you agree to follow server rules, not abuse power, and remain compliant with ThinkLink's final decisions?"
];

async function startApplication(i, title, questions, color, prefix) {
  if (!isTicketChannel(i.channel)) {
    return i.reply({
      content: "This command must be used inside a ticket channel.",
      ephemeral: true
    });
  }

  const mention = await getTicketOpenerMention(i.channel);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(`${mention}\n\n${questions[0]}`)
    .setColor(color)
    .setFooter({ text: `Question 1 of ${questions.length}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${prefix}_back_0`)
      .setLabel("Back")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`${prefix}_next_1`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary)
  );

  await i.reply({ embeds: [embed], components: [row] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("modapp")
    .setDescription("Send moderation application panel in a ticket channel"),

  async execute(i) {
    await startApplication(
      i,
      "Moderation Application",
      modQuestions,
      0x3498db,
      "modapp"
    );
  },

  modQuestions
};
