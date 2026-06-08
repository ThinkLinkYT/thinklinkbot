const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const { ensureUser, updateUser } = require("../utils/database");
const { formatCoins } = require("../utils/economy");
const rods = require("../../data/rods.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fish-upgrade")
        .setDescription("Upgrade your fishing rod"),

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        const rodNames = Object.keys(rods);
        let currentIndex = rodNames.indexOf(user.fishing.rod);
        if (currentIndex === -1) {
            user.fishing.rod = rodNames[0] || "Basic Rod";
            currentIndex = 0;
        }

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
            .setDescription(`You upgraded to **${nextRod}**.`)
            .setColor("Green")
            .addFields(
                { name: "Cost", value: formatCoins(price), inline: true },
                { name: "Multiplier", value: `${rods[nextRod].multiplier}x`, inline: true },
                { name: "Wallet", value: formatCoins(user.wallet), inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
