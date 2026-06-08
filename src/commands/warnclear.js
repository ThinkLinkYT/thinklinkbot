const path = require("path");
const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");
const { readJSON, writeJSONAtomic } = require("../utils/jsonStore");

const WARN_FILE = path.join(__dirname, "../../data/warnings.json");

const ALLOWED_ROLES = [
  "1265101131353428049",
  "1437256836985389066",
  "1409244970665115759",
  "1265101270960570392",
  "1400923093035257856"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warnclear")
    .setDescription("Clear all warnings or a specific user's warnings.")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User whose warnings to clear")
        .setRequired(false)
    ),

  async execute(interaction) {
    const member = interaction.member;

    // Permission check
    if (!member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id))) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true
      });
    }

    const target = interaction.options.getUser("user");

    // Load warnings
    let warnings = readJSON(WARN_FILE, {});

    let message = "";

    if (target) {
      // Clear specific user's warnings
      delete warnings[target.id];
      writeJSONAtomic(WARN_FILE, warnings, 2);
      message = `Cleared warnings for **${target.tag}**.`;
    } else {
      // Clear all warnings
      warnings = {};
      writeJSONAtomic(WARN_FILE, warnings, 2);
      message = "All warnings have been cleared.";
    }

    const embed = new EmbedBuilder()
      .setTitle("🧹 Warnings Cleared")
      .setColor("#00b894")
      .setDescription(message)
      .setTimestamp()
      .setFooter({ text: `Action by ${interaction.user.tag}` });

    return interaction.reply({ embeds: [embed] });
  }
};
