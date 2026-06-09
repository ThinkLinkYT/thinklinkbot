const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("magic8ball")
    .setDescription("Ask the Magic 8-Ball a question")
    .addStringOption(option =>
      option
        .setName("question")
        .setDescription("Your question for the 8-Ball")
        .setRequired(true)
    ),

  async execute(i) {
    const q = i.options.getString("question");

    const responses = [
      "It is certain.",
      "Without a doubt.",
      "Yes, definitely.",
      "Most likely.",
      "Outlook good.",
      "Yes.",
      "Signs point to yes.",
      "Reply hazy, try again.",
      "Ask again later.",
      "Better not tell you now.",
      "Cannot predict now.",
      "Don't count on it.",
      "My reply is no.",
      "Outlook not so good.",
      "Very doubtful."
    ];

    const answer = responses[Math.floor(Math.random() * responses.length)];

    const embed = new EmbedBuilder()
      .setTitle("🎱 Magic 8 Ball")
      .setColor("#4b0082")
      .addFields(
        { name: "You asked", value: `*${q}*` },
        { name: "Answer", value: `**${answer}**` }
      )
      .setFooter({ text: `Asked by ${i.user.username}` })
      .setTimestamp();

    await i.reply({ embeds: [embed] });
  }
};
