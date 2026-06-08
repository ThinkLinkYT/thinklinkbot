const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const houses = require("../../data/houses.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("house-sell")
        .setDescription("Sell your current house for a reduced price"),

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        if (!user.house) {
            const embed = new EmbedBuilder()
                .setTitle("❌ No House Owned")
                .setColor("Red")
                .setDescription("You do not own a house to sell.");
            return interaction.reply({ embeds: [embed] });
        }

        const houseName = user.house;
        const houseData = houses[houseName];

        if (!houseData) {
            const embed = new EmbedBuilder()
                .setTitle("❌ House Not Found")
                .setColor("Red")
                .setDescription("Your house type is not recognized.");
            return interaction.reply({ embeds: [embed] });
        }

        const sellPrice = Math.floor(houseData.price * 0.7);

        user.wallet += sellPrice;
        user.house = null;

        updateUser(userId, user);

        const embed = new EmbedBuilder()
            .setTitle("🏠 House Sold")
            .setColor("Green")
            .setDescription(`You sold your **${houseName}** for **${sellPrice} coins**.`)
            .addFields(
                { name: "New Balance", value: `${user.wallet} coins`, inline: true },
                { name: "Sellback Rate", value: "70%", inline: true }
            );

        return interaction.reply({ embeds: [embed] });
    }
};