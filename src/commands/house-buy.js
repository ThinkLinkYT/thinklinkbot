const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const houses = require("../../data/houses.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("house-buy")
        .setDescription("Buy a house")
        .addStringOption(option => {
            option.setName("type")
                .setDescription("House type")
                .setRequired(true);

            for (const houseName in houses) {
                const price = houses[houseName].price;
                option.addChoices({
                    name: `${houseName} (${price} coins)`,
                    value: houseName
                });
            }

            return option;
        }),

    async execute(interaction) {
        const type = interaction.options.getString("type");
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        const houseData = houses[type];
        if (!houseData) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Invalid House Type")
                .setColor("Red")
                .setDescription("That house does not exist.");
            return interaction.reply({ embeds: [embed] });
        }

        const price = houseData.price;

        if (user.wallet < price) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Not Enough Money")
                .setColor("Red")
                .setDescription(`You need **${price} coins** to buy a **${type}**.`);
            return interaction.reply({ embeds: [embed] });
        }

        user.wallet -= price;
        user.house = type;

        updateUser(userId, user);

        const embed = new EmbedBuilder()
            .setTitle("🏡 House Purchased!")
            .setColor("Green")
            .setDescription(`You bought a **${type}** for **${price} coins**!`)
            .addFields(
                { name: "New Balance", value: `${user.wallet} coins`, inline: true }
            );

        return interaction.reply({ embeds: [embed] });
    }
};