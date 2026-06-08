const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser } = require("../utils/database");
const petsData = require("../../data/pets.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pets")
        .setDescription("View all your pets"),

    async execute(interaction) {
        const user = ensureUser(interaction.user.id);

        if (!user.pets.owned.length) {
            return interaction.reply("❌ You don't own any pets.");
        }

        const embed = new EmbedBuilder()
            .setTitle("🐾 Your Pets")
            .setColor("#FF69B4");

        user.pets.owned.forEach(petName => {
            // Extract base pet type (remove nickname)
            const baseName = petName.split(" (")[0];

            // Find pet data in pets.json
            let petInfo = null;
            let rarity = "Unknown";

            for (const r in petsData) {
                const found = petsData[r].find(p => p.name === baseName);
                if (found) {
                    petInfo = found;
                    rarity = r;
                }
            }

            // If petInfo is missing, avoid crashing
            if (!petInfo) {
                embed.addFields({
                    name: petName,
                    value: "⚠️ Pet data not found (maybe renamed incorrectly)"
                });
                return;
            }

            embed.addFields({
                name: petName,
                value: `**Rarity:** ${rarity}\n**Bonus:** ${petInfo.bonusType} +${petInfo.bonusValue}`
            });
        });

        await interaction.reply({ embeds: [embed] });
    }
};