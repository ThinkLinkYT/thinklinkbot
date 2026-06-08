const { SlashCommandBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const petsData = require("../../data/pets.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pet-sell")
        .setDescription("Sell one of your pets")
        .addStringOption(option =>
            option.setName("pet")
                .setDescription("Choose a pet to sell")
                .setRequired(true)
                .setAutocomplete(true)
        ),

    // Autocomplete list of owned pets
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
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        if (!user.pets.owned.length)
            return interaction.reply("❌ You don't own any pets.");

        const petName = interaction.options.getString("pet");

        if (!user.pets.owned.includes(petName))
            return interaction.reply("❌ You don't own that pet.");

        // Extract base pet type (remove nickname)
        const baseName = petName.split(" (")[0];

        // Find pet data in pets.json
        let petInfo = null;
        for (const rarity in petsData) {
            const found = petsData[rarity].find(p => p.name === baseName);
            if (found) petInfo = found;
        }

        if (!petInfo)
            return interaction.reply("⚠️ Could not find pet data. It may be corrupted.");

        // Sell price = 50% of original
        const sellPrice = Math.floor(petInfo.price * 0.5);

        // Remove pet from owned list
        user.pets.owned = user.pets.owned.filter(p => p !== petName);

        // Unequip if equipped
        if (user.pets.equipped === petName)
            user.pets.equipped = null;

        // Add coins
        user.wallet += sellPrice;

        updateUser(userId, user);

        return interaction.reply(
            `🐾 You sold **${petName}** for **${sellPrice} coins**!`
        );
    }
};