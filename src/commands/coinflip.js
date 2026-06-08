const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureUser, updateUser } = require("../utils/database");
const { isValidEconomyAmount, formatCoins } = require("../utils/economy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("coinflip")
        .setDescription("Bet on heads or tails")
        .addStringOption(o =>
            o.setName("choice")
                .setDescription("heads or tails")
                .setRequired(true)
                .addChoices(
                    { name: "Heads", value: "heads" },
                    { name: "Tails", value: "tails" }
                )
        )
        .addIntegerOption(o =>
            o.setName("bet")
                .setDescription("Amount to bet")
                .setRequired(true)
        ),

    async execute(i) {
        const choice = i.options.getString("choice");
        const bet = i.options.getInteger("bet");
        const userId = i.user.id;
        const user = ensureUser(userId);

        if (!isValidEconomyAmount(bet))
            return i.reply("Bet must be a positive whole number up to 1,000,000,000 coins.");

        if (user.wallet < bet)
            return i.reply("You don't have enough money.");

        const result = Math.random() < 0.5 ? "heads" : "tails";

        let won = false;
        let amountWon = 0;
        let amountLost = 0;

        if (result === choice) {
            won = true;
            amountWon = bet;
            user.wallet += amountWon;
        } else {
            amountLost = bet;
            user.wallet -= amountLost;
        }

        updateUser(userId, user);

        const embed = new EmbedBuilder()
            .setTitle("🪙 Coinflip Results")
            .setColor(won ? "Green" : "Red")
            .addFields(
                { name: "Your Choice", value: choice, inline: true },
                { name: "Result", value: result, inline: true },
                won
                    ? { name: "Net Change", value: `+${formatCoins(amountWon)}`, inline: false }
                    : { name: "Net Change", value: `-${formatCoins(amountLost)}`, inline: false },
                { name: "New Balance", value: formatCoins(user.wallet), inline: false }
            );

        return i.reply({ embeds: [embed] });
    }
};
