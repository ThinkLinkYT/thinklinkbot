const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const { isValidEconomyAmount, formatCoins } = require("../utils/economy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("give")
        .setDescription("Give money to another player")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("User to give money to")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("amount")
                .setDescription("Amount of money to give")
                .setRequired(true)
        ),

    async execute(interaction) {
        const target = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        const giverId = interaction.user.id;
        const receiverId = target.id;

        // Prevent giving to yourself
        if (giverId === receiverId) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Invalid Action")
                .setColor("Red")
                .setDescription("You cannot give money to yourself.");

            return interaction.reply({ embeds: [embed] });
        }

        if (target.bot) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Invalid Recipient")
                .setColor("Red")
                .setDescription("You cannot send economy coins to a bot account.");

            return interaction.reply({ embeds: [embed] });
        }

        const giver = ensureUser(giverId);
        const receiver = ensureUser(receiverId);

        // Invalid amount
        if (!isValidEconomyAmount(amount)) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Invalid Amount")
                .setColor("Red")
                .setDescription("Amount must be a positive whole number up to **1,000,000,000 coins**.");

            return interaction.reply({ embeds: [embed] });
        }

        // Not enough money
        if (giver.wallet < amount) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Not Enough Money")
                .setColor("Red")
                .setDescription("You don't have enough money to give.");

            return interaction.reply({ embeds: [embed] });
        }

        // Transfer money
        giver.wallet -= amount;
        receiver.wallet += amount;

        updateUser(giverId, giver);
        updateUser(receiverId, receiver);

        const embed = new EmbedBuilder()
            .setTitle("🎁 Transfer Successful")
            .setColor("Green")
            .setDescription(
                `You gave **${amount} coins** to **${target.username}**.`
            );
        embed.addFields(
            { name: "Your Wallet", value: formatCoins(giver.wallet), inline: true },
            { name: "Recipient Wallet", value: formatCoins(receiver.wallet), inline: true }
        );

        return interaction.reply({ embeds: [embed] });
    }
};
