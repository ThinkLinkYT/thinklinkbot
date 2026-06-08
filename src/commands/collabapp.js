const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const { getTicketOpenerMention, isTicketChannel } = require("../utils/tickets");

const collabQuestions = [
  "What is your Youtube name and @?",
  "What is your java/bedrock username?",
  "What are you wanting to do in the collab?",
  "What do you play Minecraft on? If you have a PC what are the specs?",
  "Are you comfortable using the collab feature on YouTube with ThinkLink?"
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
    .setName("collabapp")
    .setDescription("Send collaboration application panel in a collab ticket channel"),

  async execute(i) {
    await startApplication(
      i,
      "Collaboration Application",
      collabQuestions,
      0x2ecc71,
      "collabapp"
    );
  },

  collabQuestions
};
