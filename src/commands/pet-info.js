const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser } = require("../utils/database");
const pets = require("../../data/pets.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pet-info")
        .setDescription("View information about one of your pets")
        .addStringOption(option =>
            option.setName("pet")
                .setDescription("Choose a pet")
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const user = ensureUser(interaction.user.id);
        const owned = user.pets.owned || [];

        const focused = interaction.options.getFocused().toLowerCase();
        const filtered = owned.filter(p => p.toLowerCase().includes(focused));

        await interaction.respond(
            filtered.map(p => ({ name: p, value: p }))
        );
    },

    async execute(interaction) {
        const user = ensureUser(interaction.user.id);
        const petName = interaction.options.getString("pet");

        if (!user.pets.owned.includes(petName))
            return interaction.reply("❌ You don't own that pet.");

        // Extract base pet type (remove nickname)
        const baseName = petName.split(" (")[0];

        // Find pet data in pets.json
        let petData = null;
        for (const rarity in pets) {
            const found = pets[rarity].find(p => p.name === baseName);
            if (found) petData = { ...found, rarity };
        }

        if (!petData)
            return interaction.reply("❌ Could not find pet data. (Did you rename it incorrectly?)");

        const embed = new EmbedBuilder()
            .setTitle(`🐾 Pet Info: ${petName}`)
            .addFields(
                { name: "Base Type", value: baseName },
                { name: "Rarity", value: petData.rarity },
                { name: "Price", value: `${petData.price} coins` },
                { name: "Bonus Type", value: petData.bonusType },
                { name: "Bonus Value", value: `${petData.bonusValue}` }
            )
            .setColor("Purple");

        await interaction.reply({ embeds: [embed] });
    }
};