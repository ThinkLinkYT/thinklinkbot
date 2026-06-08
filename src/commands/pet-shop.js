const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const pets = require("../../data/pets.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pet-shop")
        .setDescription("View all pets available for purchase"),

    async execute(interaction) {
        let desc = "";

        for (const rarity in pets) {
            desc += `**${rarity} Pets**\n`;
            pets[rarity].forEach(p => {
                desc += `• **${p.name}** — ${p.price} coins (${p.bonus})\n`;
            });
            desc += "\n";
        }

        const embed = new EmbedBuilder()
            .setTitle("🐾 Pet Shop")
            .setDescription(desc)
            .setColor("Purple");

        await interaction.reply({ embeds: [embed] });
    }
};