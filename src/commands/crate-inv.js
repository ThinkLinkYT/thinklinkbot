const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser } = require("../utils/database");
const crates = require("../../data/crates.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("crate-inv")
        .setDescription("View your crates"),

    async execute(interaction) {
        const user = ensureUser(interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle("📦 Your Crates")
            .setColor("Orange");

        let found = false;

        for (const crateName in crates) {
            const amount = user.inventory[crateName] || 0;
            if (amount > 0) {
                embed.addFields({
                    name: crateName,
                    value: `${amount}`,
                    inline: true
                });
                found = true;
            }
        }

        if (!found)
            return interaction.reply("You have no crates.");

        await interaction.reply({ embeds: [embed] });
    }
};