const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const fishData = require("../../data/fish.json");

const prices = {
    crops: { Wheat: 5, Carrot: 6, Potato: 7, Pumpkin: 10, "Golden Seed": 50 },
    wood: { Oak: 4, Birch: 5, Pine: 6, Maple: 8, "Ancient Bark": 40 },
    ores: { Copper: 8, Iron: 12, Gold: 20, Diamond: 40, Ruby: 60 }
};

// Build fish price map from fish.json
const fishPrices = {};
for (const rarity in fishData) {
    for (const fish of fishData[rarity]) {
        fishPrices[fish.name] = fish.value;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sell")
        .setDescription("Sell all items of a category")
        .addStringOption(option =>
            option.setName("category")
                .setDescription("What do you want to sell?")
                .setRequired(true)
                .addChoices(
                    { name: "Crops", value: "crops" },
                    { name: "Wood", value: "wood" },
                    { name: "Ores", value: "ores" },
                    { name: "Fish", value: "fish" }
                )
        ),

    async execute(interaction) {
        const category = interaction.options.getString("category");
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        let items;
        let inv;

        if (category === "fish") {
            items = fishPrices;
            inv = user.fishing.inventory;
        } else {
            items = prices[category];
            inv = user.inventory;
        }

        if (!items) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Invalid Category")
                .setColor("Red")
                .setDescription("That category does not exist.");
            return interaction.reply({ embeds: [embed] });
        }

        let totalEarned = 0;
        let soldList = [];

        for (const item in items) {
            const qty = inv[item] || 0;
            if (qty > 0) {
                const value = qty * items[item];
                totalEarned += value;
                soldList.push(`💰 **${qty}× ${item}** → ${value} coins`);
                inv[item] = 0;
            }
        }

        if (totalEarned === 0) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Nothing to Sell")
                .setColor("Red")
                .setDescription("You don't have any items in this category.");
            return interaction.reply({ embeds: [embed] });
        }

        user.wallet += totalEarned;
        updateUser(userId, user);

        const embed = new EmbedBuilder()
            .setTitle("🛒 Items Sold")
            .setColor("Green")
            .setDescription(soldList.join("\n"))
            .addFields({ name: "Total Earned", value: `${totalEarned} coins` });

        return interaction.reply({ embeds: [embed] });
    }
};