const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("withdraw")
        .setDescription("Withdraw money from your bank")
        .addIntegerOption(option =>
            option.setName("amount")
                .setDescription("Amount to withdraw")
                .setRequired(true)
        ),

    async execute(interaction) {
        const amount = interaction.options.getInteger("amount");
        const userId = interaction.user.id;
        const user = ensureUser(userId);

        // ❌ Invalid amount
        if (amount <= 0) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Invalid Amount")
                .setColor("Red")
                .setDescription("The withdrawal amount must be **greater than 0**.");

            return interaction.reply({ embeds: [embed] });
        }

        // ❌ Not enough money
        if (user.bank < amount) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Insufficient Funds")
                .setColor("Red")
                .setDescription("You don't have enough money in your bank to withdraw that amount.");

            return interaction.reply({ embeds: [embed] });
        }

        // ✔ Process withdrawal
        user.bank -= amount;
        user.wallet += amount;

        updateUser(userId, user);

        const embed = new EmbedBuilder()
            .setTitle("🏦 Withdrawal Successful")
            .setColor("Green")
            .addFields(
                { name: "Amount Withdrawn", value: `${amount} coins`, inline: true },
                { name: "New Wallet Balance", value: `${user.wallet} coins`, inline: true },
                { name: "New Bank Balance", value: `${user.bank} coins`, inline: true }
            );

        return interaction.reply({ embeds: [embed] });
    }
};