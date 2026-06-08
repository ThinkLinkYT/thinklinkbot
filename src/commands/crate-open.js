const { SlashCommandBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const crates = require("../../data/crates.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("crate-open")
        .setDescription("Open a crate")
        .addStringOption(option =>
            option.setName("crate")
                .setDescription("Choose a crate to open")
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const user = ensureUser(interaction.user.id);

        const owned = Object.keys(crates)
            .filter(crate => user.inventory[crate] > 0)
            .map(crate => ({
                name: `${crate} (${user.inventory[crate]})`,
                value: crate
            }));

        await interaction.respond(owned);
    },

    async execute(interaction) {
        const crateName = interaction.options.getString("crate");
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        if (!user.inventory[crateName] || user.inventory[crateName] <= 0)
            return interaction.reply("❌ You don't have that crate.");

        const crate = crates[crateName];

        // Remove crate
        user.inventory[crateName]--;

        // Reward pools
        const woods = ["Oak", "Pine", "Birch"];
        const ores = ["Gold", "Diamond"];
        const crops = ["Wheat", "Carrot", "Potato"];
        const pets = ["Cat", "Dog", "Fox", "Dragon", "Bird"];

        // Weighted chances per crate rarity
        const chances = {
            "Common Crate":    { material: 60, coins: 30, item: 8, pet: 2 },
            "Uncommon Crate":  { material: 50, coins: 30, item: 15, pet: 5 },
            "Rare Crate":      { material: 40, coins: 30, item: 20, pet: 10 },
            "Epic Crate":      { material: 30, coins: 30, item: 25, pet: 15 },
            "Legendary Crate": { material: 20, coins: 30, item: 30, pet: 20 }
        };

        const roll = Math.random() * 100;
        const c = chances[crateName];

        let rewardMessage = "";

        // MATERIAL DROP
        if (roll < c.material) {
            const pool = [...woods, ...ores, ...crops];
            const reward = pool[Math.floor(Math.random() * pool.length)];

            user.inventory[reward] = (user.inventory[reward] || 0) + 1;

            rewardMessage = `🌿 You received **${reward}**!`;
        }

        // COINS DROP
        else if (roll < c.material + c.coins) {
            const coinRanges = {
                "Common Crate": [20, 50],
                "Uncommon Crate": [50, 120],
                "Rare Crate": [120, 250],
                "Epic Crate": [250, 500],
                "Legendary Crate": [500, 1000]
            };

            const [min, max] = coinRanges[crateName];
            const amount = Math.floor(Math.random() * (max - min + 1)) + min;

            user.wallet += amount;

            rewardMessage = `💰 You received **${amount} coins**!`;
        }

        // ITEM DROP (your existing items)
        else if (roll < c.material + c.coins + c.item) {
            const reward = crate.rewards[Math.floor(Math.random() * crate.rewards.length)];

            user.inventory[reward] = (user.inventory[reward] || 0) + 1;

            rewardMessage = `🎁 You received **${reward}**!`;
        }

        // PET DROP
        else {
            const pet = pets[Math.floor(Math.random() * pets.length)];

            if (!user.pets.owned.includes(pet))
                user.pets.owned.push(pet);

            rewardMessage = `🐾 You found a **${pet}** pet!`;
        }

        updateUser(userId, user);

        await interaction.reply(`🎉 You opened a **${crateName}**!\n${rewardMessage}`);
    }
};