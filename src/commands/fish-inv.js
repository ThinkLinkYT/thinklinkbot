const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const { ensureUser } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fish-inv")
        .setDescription("View your fish inventory"),

    async execute(interaction) {
        const user = ensureUser(interaction.user.id);
        const inv = user.fishing.inventory;

        if (!Object.keys(inv).length)
            return interaction.reply("You don't have any fish yet.");

        const lines = Object.entries(inv)
            .map(([name, qty]) => `🐟 **${name}** — ${qty}`)
            .join("\n");

        const embed = new EmbedBuilder()
            .setTitle("🎣 Your Fish Inventory")
            .setDescription(lines)
            .setColor("Aqua");

        await interaction.reply({ embeds: [embed] });
    }
};