const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { collabQuestions } = require("../commands/collabapp");
const { getTicketOpenerMention } = require("../utils/tickets");

async function navigateApplication(i, questions, title, color, prefix) {
  const idx = parseInt(i.customId.split("_")[2]);
  const newIdx = Math.max(0, Math.min(idx, questions.length - 1));
  const mention = await getTicketOpenerMention(i.channel);
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(`${mention}\n\n${questions[newIdx]}`)
    .setColor(color)
    .setFooter({ text: `Question ${newIdx + 1} of ${questions.length}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${prefix}_back_${newIdx - 1}`)
      .setLabel("Back")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(newIdx === 0),
    new ButtonBuilder()
      .setCustomId(`${prefix}_next_${newIdx + 1}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(newIdx === questions.length - 1)
  );
  await i.update({ embeds: [embed], components: [row] });
}

module.exports = {
  id: "collabapp_nav",
  async execute(i) {
    await navigateApplication(
      i,
      collabQuestions,
      "Collaboration Application",
      0x2ecc71,
      "collabapp"
    );
  }
};
