const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pet-inventory")
        .setDescription("View your pets"),

    async execute(interaction) {
        const user = ensureUser(interaction.user.id);

        if (!user.pets.owned.length)
            return interaction.reply("You don't own any pets yet.");

        const embed = new EmbedBuilder()
            .setTitle("🐾 Your Pets")
            .setDescription(user.pets.owned.map(p => `• ${p}`).join("\n"))
            .setColor("Blue");

        if (user.pets.equipped)
            embed.addFields({ name: "Equipped", value: user.pets.equipped });

        await interaction.reply({ embeds: [embed] });
    }
};