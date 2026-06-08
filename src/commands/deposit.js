const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const { isValidEconomyAmount, formatCoins } = require("../utils/economy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deposit")
        .setDescription("Deposit money into your bank")
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("Amount to deposit")
                .setRequired(true)
        ),

    async execute(interaction) {
        const amount = interaction.options.getInteger("amount");
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        if (!isValidEconomyAmount(amount)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Invalid Amount")
                        .setColor("Red")
                        .setDescription("The amount must be a positive whole number up to **1,000,000,000 coins**.")
                ],
                ephemeral: true
            });
        }

        if (user.wallet < amount) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Insufficient Funds")
                        .setColor("Red")
                        .setDescription("You don't have enough money in your **wallet** to deposit that amount.")
                ],
                ephemeral: true
            });
        }

        user.wallet -= amount;
        user.bank += amount;
        updateUser(userId, user);

        const embed = new EmbedBuilder()
            .setTitle("🏦 Deposit Successful")
            .setColor("Green")
            .addFields(
                { name: "Deposited", value: formatCoins(amount), inline: true },
                { name: "New Wallet Balance", value: formatCoins(user.wallet), inline: true },
                { name: "New Bank Balance", value: formatCoins(user.bank), inline: true }
            )
            .setFooter({ text: "Thanks for banking with us!" });

        await interaction.reply({ embeds: [embed] });
    }
};
