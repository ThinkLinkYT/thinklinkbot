const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser } = require("../utils/database");
const rods = require("../../data/rods.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fish-rod")
        .setDescription("View your fishing rod"),

    async execute(interaction) {
        const user = ensureUser(interaction.user.id);
        const rodName = user.fishing.rod;
        const rod = rods[rodName];

        const embed = new EmbedBuilder()
            .setTitle("🎣 Your Fishing Rod")
            .setColor("Green")
            .addFields(
                { name: "Rod", value: rodName },
                { name: "Rarity Boost", value: `${rod.rarityBoost}%` },
                { name: "Fail Reduction", value: `${rod.failReduction}%` }
            );

        await interaction.reply({ embeds: [embed] });
    }
};