const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Show the server rules panel"),

  async execute(i) {
    const embed = new EmbedBuilder()
      .setTitle("📜 Server Rules")
      .setDescription(
        "Please follow these rules to keep our community safe and fun. Breaking rules may result in warnings or bans depending on severity.\n\n" +
        "Staff roles <@&1265101270960570392>, <@&1400923093035257856>, <@&1409244970665115759>, <@&1437256836985389066>, and <@&1265101131353428049> may use discretion when enforcing rules. " +
        "Final authority rests with <@&1265101131353428049>."
      )
      .setColor(0xE67E22)
      .addFields(
        { name: "1️⃣ No Spamming", value: "First punishment is a warning." },
        { name: "2️⃣ Limit Profanity", value: "First punishment is a warning." },
        {
          name: "3️⃣ No Controversial Topics (Mainly Politics)",
          value: "First punishment is a warning."
        },
        {
          name: "4️⃣ No Racial Slurs, Offensive Language, or Racial Comments",
          value: "Strictly prohibited."
        },
        {
          name: "5️⃣ Talk in the Right Channels",
          value:
            "- Advertise only in <#1265400356452565123>\n" +
            "- Truth or Dare only in <#1429881716327321630>\n" +
            "- Bot commands only in <#1435629170821431346>\n" +
            "- Gambling only in <#1359188898038944045>\n" +
            "- Use common sense for other channels."
        },
        {
          name: "6️⃣ No Inappropriate Content",
          value:
            "Images, files, or comments including porn/NSFW/sexual content → **Instant Ban**."
        },
        {
          name: "7️⃣ Limit Pinging <@1169759575981953177>",
          value: "Respect their time."
        },
        {
          name: "8️⃣ No Doxing or Threatening to Dox Anyone",
          value: "Absolutely forbidden."
        }
      )
      .setFooter({ text: "Breaking rules may result in warnings or bans." });

    await i.reply({ embeds: [embed] });
  }
};
