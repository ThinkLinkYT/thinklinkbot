const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const { ensureUser, updateUser } = require("../utils/database");
const rods = require("../../data/rods.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fish-upgrade")
        .setDescription("Upgrade your fishing rod"),

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        const rodNames = Object.keys(rods);
        const currentIndex = rodNames.indexOf(user.fishing.rod);

        if (currentIndex === rodNames.length - 1)
            return interaction.reply("Your rod is already max level.");

        const nextRod = rodNames[currentIndex + 1];
        const basePrice = rods[nextRod].price;

        // Exponential scaling
        const price = Math.floor(basePrice * Math.pow(1.8, currentIndex));

        if (user.wallet < price)
            return interaction.reply(`You need **${price} coins** to upgrade to **${nextRod}**.`);

        user.wallet -= price;
        user.fishing.rod = nextRod;

        updateUser(userId, user);

        const embed = new EmbedBuilder()
            .setTitle("🎣 Rod Upgraded!")
            .setDescription(`You upgraded to **${nextRod}**!\nMultiplier: **${rods[nextRod].multiplier}x**`)
            .setColor("Green");

        await interaction.reply({ embeds: [embed] });
    }
};