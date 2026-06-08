const { SlashCommandBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const pets = require("../../data/pets.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pet-buy")
        .setDescription("Buy a pet from the shop")
        .addStringOption(option => {
            option.setName("pet")
                .setDescription("Choose a pet to buy")
                .setRequired(true);

            // Add all pets as choices
            for (const rarity in pets) {
                pets[rarity].forEach(pet => {
                    option.addChoices({
                        name: `${pet.name} (${rarity})`,
                        value: pet.name
                    });
                });
            }

            return option;
        }),

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = ensureUser(userId);
        const petName = interaction.options.getString("pet");

        // Find pet
        let pet = null;
        for (const rarity in pets) {
            const found = pets[rarity].find(p => p.name === petName);
            if (found) pet = found;
        }

        if (!pet) return interaction.reply("❌ That pet does not exist.");

        if (user.wallet < pet.price)
            return interaction.reply(`❌ You need **${pet.price} coins** to buy **${pet.name}**.`);

        if (user.pets.owned.includes(pet.name))
            return interaction.reply("❌ You already own this pet.");

        user.wallet -= pet.price;
        user.pets.owned.push(pet.name);

        updateUser(userId, user);

        return interaction.reply(`🐾 You bought **${pet.name}**!`);
    }
};