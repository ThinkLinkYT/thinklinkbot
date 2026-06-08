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
    .setName("warn")
    .setDescription("Warn a user with escalating punishments.")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to warn")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason for the warning")
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
    const reason = interaction.options.getString("reason") || "No reason provided";

    if (!target) {
      return interaction.reply({
        content: "You must select a user to warn.",
        ephemeral: true
      });
    }

    // Load warnings
    const warnings = readJSON(WARN_FILE, {});

    // Add warning
    if (!warnings[target.id]) warnings[target.id] = 0;
    warnings[target.id]++;

    const warnCount = warnings[target.id];

    // Save warnings
    writeJSONAtomic(WARN_FILE, warnings, 2);

    // Apply punishment
    const guildMember = await interaction.guild.members
      .fetch(target.id)
      .catch(() => null);

    let punishment = "";

    if (warnCount === 1) {
      punishment = "⚠️ **First Warning** — No punishment applied.";
    } else if (warnCount === 2) {
      punishment = "⏳ **Second Warning** — User timed out for **1 hour**.";
      if (guildMember) {
        await guildMember.timeout(60 * 60 * 1000, "Second warning").catch(err => {
          console.error("Failed to timeout warned user:", err);
        });
      }
    } else if (warnCount === 3) {
      punishment = "⏳ **Third Warning** — User timed out for **1 day**.";
      if (guildMember) {
        await guildMember.timeout(24 * 60 * 60 * 1000, "Third warning").catch(err => {
          console.error("Failed to timeout warned user:", err);
        });
      }
    } else if (warnCount >= 4) {
      punishment =
        "🚨 **Fourth Warning** — Escalation required. <@1169759575981953177> please review.";
    }

    // Embed
    const embed = new EmbedBuilder()
      .setTitle("⚠️ User Warned")
      .setColor("#ffcc00")
      .addFields(
        { name: "👤 User", value: `<@${target.id}>`, inline: true },
        { name: "📝 Reason", value: reason, inline: true },
        { name: "📊 Total Warnings", value: `${warnCount}`, inline: true },
        { name: "⛔ Punishment", value: punishment }
      )
      .setTimestamp()
      .setFooter({ text: `Warned by ${interaction.user.tag}` });

    return interaction.reply({
      content: `<@${target.id}>`,
      embeds: [embed],
      allowedMentions: { users: [target.id, "1169759575981953177"] }
    });
  }
};
