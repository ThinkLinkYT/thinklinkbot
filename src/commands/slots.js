const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("slots")
        .setDescription("Play the slot machine")
        .addIntegerOption(o =>
            o.setName("bet")
                .setDescription("Amount to bet")
                .setRequired(true)
        ),

    async execute(i) {
        const bet = i.options.getInteger("bet");
        const userId = i.user.id;
        const user = ensureUser(userId);

        if (bet <= 0) {
            return i.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Invalid Bet")
                        .setColor("Red")
                        .setDescription("Your bet must be greater than **0**.")
                ]
            });
        }

        if (user.wallet < bet) {
            return i.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Not Enough Money")
                        .setColor("Red")
                        .setDescription("You don't have enough money to place that bet.")
                ]
            });
        }

        const symbols = ["🍒", "🍋", "⭐", "💎"];
        const roll = () => symbols[Math.floor(Math.random() * symbols.length)];

        const a = roll();
        const b = roll();
        const c = roll();

        let winnings = 0;

        if (a === b && b === c) winnings = bet * 5;
        else if (a === b || b === c || a === c) winnings = bet * 2;

        user.wallet += winnings - bet;
        updateUser(userId, user);

        const resultText =
            winnings > 0
                ? `🎉 You won **${winnings} coins**!`
                : `💀 You lost **${bet} coins**. Better luck next time.`;

        const embed = new EmbedBuilder()
            .setTitle("🎰 Slot Machine")
            .setColor(winnings > 0 ? "Green" : "Red")
            .addFields(
                { name: "Result", value: `**${a} | ${b} | ${c}**`, inline: false },
                { name: "Bet", value: `${bet} coins`, inline: true },
                { name: "Payout", value: `${winnings} coins`, inline: true },
                { name: "New Balance", value: `${user.wallet} coins`, inline: false }
            )
            .setFooter({ text: "Feeling lucky? Try again!" });

        return i.reply({ embeds: [embed] });
    }
};