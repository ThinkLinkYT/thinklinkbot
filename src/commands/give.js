const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");

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

        const giver = ensureUser(giverId);
        const receiver = ensureUser(receiverId);

        // Invalid amount
        if (amount <= 0) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Invalid Amount")
                .setColor("Red")
                .setDescription("Amount must be greater than 0.");

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

        return interaction.reply({ embeds: [embed] });
    }
};